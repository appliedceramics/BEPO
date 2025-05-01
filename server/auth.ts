import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, RegisterUser, LoginUser, Profile, InsertProfile, registerUserSchema, loginUserSchema, sexEnum } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      profile?: Profile;
    }
  }
}

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using scrypt
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a provided password with a stored hashed password
 */
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const PostgresSessionStore = connectPg(session);

export function setupAuth(app: Express) {
  // Configure session middleware
  const sessionSettings: session.SessionOptions = {
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'motavasecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  // Initialize session and passport
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Get user's profile if it exists
        const profile = await storage.getProfileByUserId(user.id);
        const userWithProfile = { ...user, profile };
        
        return done(null, userWithProfile);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Get user's profile if it exists
      const profile = await storage.getProfileByUserId(user.id);
      const userWithProfile = { ...user, profile };
      
      done(null, userWithProfile);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        username: userData.username,
        email: userData.email,
        password: await hashPassword(userData.password),
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ id: user.id, username: user.username, email: user.email });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      // Validate request body
      loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: Express.User, info: any) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ error: info?.message || "Authentication failed" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          
          // Return user without password and with profile if exists
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Create or update user profile
  app.post("/api/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Validate sex enum
      if (req.body.sex && !sexEnum.safeParse(req.body.sex).success) {
        return res.status(400).json({ error: "Invalid sex value. Must be 'male', 'female', or 'other'" });
      }

      const userId = req.user.id;
      const existingProfile = await storage.getProfileByUserId(userId);
      
      console.log('Received profile update request:', req.body);
      
      // Clean up empty string fields
      const cleanData = Object.entries(req.body).reduce((acc, [key, value]) => {
        // Don't include empty strings, but keep boolean false values
        if (value === '') {
          return acc;
        }
        acc[key] = value;
        return acc;
      }, {});
      
      console.log('Cleaned profile data:', cleanData);

      if (existingProfile) {
        // Update existing profile
        const updatedProfile = await storage.updateProfile(existingProfile.id, {
          ...cleanData,
          userId
        });
        console.log('Updated profile:', updatedProfile);
        return res.status(200).json(updatedProfile);
      } else {
        // Create new profile
        const newProfile = await storage.createProfile({
          ...cleanData,
          userId
        });
        console.log('Created new profile:', newProfile);
        return res.status(201).json(newProfile);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      next(error);
    }
  });

  // Get current user's profile
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const profile = await storage.getProfileByUserId(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}

// Middleware to check if user has a profile
export function hasProfile(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (!req.user.profile) {
    return res.status(403).json({ error: "Profile required", code: "PROFILE_REQUIRED" });
  }
  
  next();
}