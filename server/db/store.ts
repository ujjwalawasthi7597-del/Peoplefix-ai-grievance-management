import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  IUser,
  IDepartment,
  IComplaint,
  IComplaintHistoryItem,
  INotification,
  IEscalation,
  IAuditLog,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types.ts';

// File-based persistence storage directory
const DATA_DIR = path.resolve(process.cwd(), '.civicfix_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CivicFixDbData {
  users: IUser[];
  departments: IDepartment[];
  complaints: IComplaint[];
  history: IComplaintHistoryItem[];
  notifications: INotification[];
  escalations: IEscalation[];
  auditLogs: IAuditLog[];
}

const DB_FILE = path.join(DATA_DIR, 'db.json');

// Memory cache of the database
let memoryDb: CivicFixDbData | null = null;

// Connect to MongoDB if MONGODB_URI is provided
export async function initializeDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('[CivicFix DB] Attempting connection to MongoDB Atlas...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('[CivicFix DB] Successfully connected to MongoDB Atlas!');
    } catch (err: any) {
      console.warn('[CivicFix DB] Could not connect to external MongoDB Atlas:', err.message);
      console.log('[CivicFix DB] Falling back to robust local persistent store with JSON disk persistence.');
    }
  } else {
    console.log('[CivicFix DB] No MONGODB_URI provided. Initializing self-contained persistent store.');
  }

  // Load from disk or seed
  await loadOrSeedData();
}

function loadFromDisk(): CivicFixDbData | null {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[CivicFix DB] Error reading database file:', err);
  }
  return null;
}

function saveToDisk(data: CivicFixDbData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CivicFix DB] Error saving to disk:', err);
  }
}

// Generate realistic seed data
async function seedInitialData(): Promise<CivicFixDbData> {
  console.log('[CivicFix DB] Generating default municipal seed data...');

  const passwordHash = await bcrypt.hash('Citizen@123', 10);
  const officerHash = await bcrypt.hash('Officer@123', 10);
  const adminHash = await bcrypt.hash('Admin@123', 10);

  const departments: IDepartment[] = [
    {
      id: 'dept-roads',
      name: 'Public Works & Roads',
      code: 'PWR',
      description: 'Responsible for road maintenance, pothole patching, asphalt resurfacing, and pavement safety.',
      categories: ['Road Damage / Potholes', 'Broken Footpaths'],
      headOfficerId: 'user-officer-roads',
      headOfficerName: 'Officer Rajesh Kumar',
      slaHours: { Critical: 12, High: 24, Medium: 48, Low: 96 },
      contactEmail: 'roads@civicfix.gov',
      contactPhone: '+1-555-019-2001',
      isActive: true,
    },
    {
      id: 'dept-sanitation',
      name: 'Sanitation & Solid Waste Management',
      code: 'SWM',
      description: 'Oversees municipal garbage collection, litter clearing, dumpster maintenance, and neighborhood cleanliness.',
      categories: ['Garbage Collection', 'Public Sanitation'],
      headOfficerId: 'user-officer-sanitation',
      headOfficerName: 'Officer Priya Sharma',
      slaHours: { Critical: 8, High: 18, Medium: 36, Low: 72 },
      contactEmail: 'sanitation@civicfix.gov',
      contactPhone: '+1-555-019-2002',
      isActive: true,
    },
    {
      id: 'dept-electrical',
      name: 'Electrical & Street Lighting',
      code: 'ESL',
      description: 'Maintains streetlights, high-mast lamps, junction boxes, and public electrical fixtures.',
      categories: ['Streetlight Failure'],
      headOfficerId: 'user-officer-electrical',
      headOfficerName: 'Officer Amit Patel',
      slaHours: { Critical: 12, High: 24, Medium: 48, Low: 72 },
      contactEmail: 'lighting@civicfix.gov',
      contactPhone: '+1-555-019-2003',
      isActive: true,
    },
    {
      id: 'dept-water',
      name: 'Water Supply & Sewerage',
      code: 'WSS',
      description: 'Manages municipal potable water pipes, valve leaks, main line ruptures, and sewage disposal.',
      categories: ['Water Leakage', 'Sewage Overflow'],
      headOfficerId: 'user-officer-water',
      headOfficerName: 'Officer Vikram Singh',
      slaHours: { Critical: 6, High: 16, Medium: 36, Low: 72 },
      contactEmail: 'watersupply@civicfix.gov',
      contactPhone: '+1-555-019-2004',
      isActive: true,
    },
    {
      id: 'dept-drainage',
      name: 'Stormwater Drainage & Flood Control',
      code: 'SDF',
      description: 'Handles blocked monsoon storm drains, silted culverts, and urban drainage bottlenecks.',
      categories: ['Drainage Problems'],
      headOfficerId: 'user-officer-drainage',
      headOfficerName: 'Officer Anita Desai',
      slaHours: { Critical: 10, High: 24, Medium: 48, Low: 96 },
      contactEmail: 'drainage@civicfix.gov',
      contactPhone: '+1-555-019-2005',
      isActive: true,
    },
    {
      id: 'dept-traffic',
      name: 'Traffic Operations & Road Safety',
      code: 'TORS',
      description: 'Coordinates traffic signals, pedestrian crossings, speed humps, and civic hazard warnings.',
      categories: ['Traffic Signal Problems', 'Other Civic Issues'],
      headOfficerId: 'user-officer-traffic',
      headOfficerName: 'Officer David Wilson',
      slaHours: { Critical: 8, High: 20, Medium: 40, Low: 72 },
      contactEmail: 'traffic@civicfix.gov',
      contactPhone: '+1-555-019-2006',
      isActive: true,
    },
  ];

  const users: IUser[] = [
    {
      id: 'user-citizen-1',
      name: 'Alex Johnson',
      email: 'citizen@civicfix.org',
      phone: '+1-555-012-3456',
      role: 'citizen',
      passwordHash,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-officer-roads',
      name: 'Rajesh Kumar (Roads Lead)',
      email: 'officer.roads@civicfix.org',
      phone: '+1-555-014-9821',
      role: 'officer',
      departmentId: 'dept-roads',
      departmentName: 'Public Works & Roads',
      passwordHash: officerHash,
      isActive: true,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-officer-sanitation',
      name: 'Priya Sharma (Sanitation Lead)',
      email: 'officer.sanitation@civicfix.org',
      phone: '+1-555-017-4321',
      role: 'officer',
      departmentId: 'dept-sanitation',
      departmentName: 'Sanitation & Solid Waste Management',
      passwordHash: officerHash,
      isActive: true,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-admin-1',
      name: 'Sarah Chen (Commissioner)',
      email: 'admin@civicfix.org',
      phone: '+1-555-019-8765',
      role: 'admin',
      passwordHash: adminHash,
      isActive: true,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const now = Date.now();

  const complaints: IComplaint[] = [
    {
      id: 'comp-1001',
      complaintId: 'CF-2026-1001',
      citizenId: 'user-citizen-1',
      citizenName: 'Alex Johnson',
      citizenPhone: '+1-555-012-3456',
      citizenEmail: 'citizen@civicfix.org',
      title: 'Deep crater pothole near Oak Street primary school crossing',
      description: 'A 6-inch deep pothole has expanded across the westbound lane right in front of the school crosswalk. Two cyclists have already lost balance this morning.',
      category: 'Road Damage / Potholes',
      departmentId: 'dept-roads',
      departmentName: 'Public Works & Roads',
      priority: 'Critical',
      aiSuggestedPriority: 'Critical',
      aiAnalysis: {
        predictedCategory: 'Road Damage / Potholes',
        confidence: 0.96,
        suggestedPriority: 'Critical',
        suggestedDepartment: 'Public Works & Roads',
        extractedKeywords: ['pothole', 'school crossing', 'hazard', 'cyclists'],
        summary: 'Deep hazardous road pothole adjacent to school pedestrian crosswalk.',
        reasoning: 'Proximity to school zone and hazard to two-wheeled vehicles poses imminent accident risk.',
        provider: 'gemini',
        safetyHazardsIdentified: ['Imminent cyclist crash risk', 'School crossing pedestrian impact'],
      },
      status: 'In Progress',
      images: [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      ],
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: '420 Oak Street, Central Civic Zone',
        landmark: 'Opposite Oak Elementary Gate B',
      },
      assignedOfficerId: 'user-officer-roads',
      assignedOfficerName: 'Rajesh Kumar (Roads Lead)',
      slaDeadline: new Date(now + 14 * 3600000).toISOString(),
      submittedAt: new Date(now - 8 * 3600000).toISOString(),
      reopenedCount: 0,
      isOverdue: false,
    },
    {
      id: 'comp-1002',
      complaintId: 'CF-2026-1002',
      citizenId: 'user-citizen-1',
      citizenName: 'Alex Johnson',
      citizenPhone: '+1-555-012-3456',
      citizenEmail: 'citizen@civicfix.org',
      title: 'Overflowing commercial dumpster blocking pedestrian pathway',
      description: 'Municipal garbage bin has not been cleared for 4 days. Waste is spilling over 10 meters onto the pavement, attracting stray animals and creating foul odor.',
      category: 'Garbage Collection',
      departmentId: 'dept-sanitation',
      departmentName: 'Sanitation & Solid Waste Management',
      priority: 'High',
      aiSuggestedPriority: 'High',
      aiAnalysis: {
        predictedCategory: 'Garbage Collection',
        confidence: 0.94,
        suggestedPriority: 'High',
        suggestedDepartment: 'Sanitation & Solid Waste Management',
        extractedKeywords: ['dumpster', 'garbage', 'spilling', 'pathway blocked', 'odor'],
        summary: 'Severe garbage accumulation spilling onto walkway.',
        reasoning: 'Biohazard risk and obstruction of public sidewalk.',
        provider: 'gemini',
      },
      status: 'Under Review',
      images: [
        'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
      ],
      location: {
        lat: 37.7812,
        lng: -122.4105,
        address: '88 Market Promenade, Ward 4',
        landmark: 'Next to Metro Exit 3',
      },
      slaDeadline: new Date(now + 10 * 3600000).toISOString(),
      submittedAt: new Date(now - 5 * 3600000).toISOString(),
      reopenedCount: 0,
      isOverdue: false,
    },
    {
      id: 'comp-1003',
      complaintId: 'CF-2026-1003',
      citizenId: 'user-citizen-1',
      citizenName: 'Alex Johnson',
      citizenPhone: '+1-555-012-3456',
      citizenEmail: 'citizen@civicfix.org',
      title: 'Main pipeline water leak spraying continuously onto roadway',
      description: 'Potable water distribution pipe burst underground. Water is gushing onto the asphalt and flooding the curb.',
      category: 'Water Leakage',
      departmentId: 'dept-water',
      departmentName: 'Water Supply & Sewerage',
      priority: 'Critical',
      aiSuggestedPriority: 'Critical',
      status: 'Assigned',
      images: [
        'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      ],
      location: {
        lat: 37.7699,
        lng: -122.4467,
        address: '150 Pinecrest Blvd, Sector 9',
        landmark: 'Near Water Tower Junction',
      },
      assignedOfficerId: 'user-officer-water',
      assignedOfficerName: 'Officer Vikram Singh',
      slaDeadline: new Date(now - 2 * 3600000).toISOString(), // Overdue by 2 hours
      submittedAt: new Date(now - 10 * 3600000).toISOString(),
      reopenedCount: 0,
      isOverdue: true,
    },
    {
      id: 'comp-1004',
      complaintId: 'CF-2026-1004',
      citizenId: 'user-citizen-1',
      citizenName: 'Alex Johnson',
      citizenPhone: '+1-555-012-3456',
      citizenEmail: 'citizen@civicfix.org',
      title: 'Flickering and dead streetlights along Pine Avenue walkway',
      description: 'Three consecutive streetlights are completely non-functional. The entire 200m stretch is in total darkness after 7 PM.',
      category: 'Streetlight Failure',
      departmentId: 'dept-electrical',
      departmentName: 'Electrical & Street Lighting',
      priority: 'Medium',
      aiSuggestedPriority: 'Medium',
      status: 'Resolved',
      images: [
        'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
      ],
      location: {
        lat: 37.7612,
        lng: -122.4289,
        address: '320 Pine Avenue, South District',
        landmark: 'Opposite Community Library',
      },
      assignedOfficerId: 'user-officer-electrical',
      assignedOfficerName: 'Officer Amit Patel',
      slaDeadline: new Date(now - 48 * 3600000).toISOString(),
      submittedAt: new Date(now - 72 * 3600000).toISOString(),
      resolvedAt: new Date(now - 24 * 3600000).toISOString(),
      reopenedCount: 0,
      isOverdue: false,
      feedback: {
        rating: 5,
        comment: 'Rapid resolution! The LED fixtures were replaced within 48 hours.',
        citizenId: 'user-citizen-1',
        citizenName: 'Alex Johnson',
        submittedAt: new Date(now - 20 * 3600000).toISOString(),
      },
    },
    {
      id: 'comp-1005',
      complaintId: 'CF-2026-1005',
      citizenId: 'user-citizen-1',
      citizenName: 'Alex Johnson',
      citizenPhone: '+1-555-012-3456',
      citizenEmail: 'citizen@civicfix.org',
      title: 'Stormwater culvert clogged with tree branches and silt',
      description: 'Drain inlet is 90% blocked ahead of anticipated weekend rainfall.',
      category: 'Drainage Problems',
      departmentId: 'dept-drainage',
      departmentName: 'Stormwater Drainage & Flood Control',
      priority: 'High',
      aiSuggestedPriority: 'High',
      status: 'Submitted',
      images: [],
      location: {
        lat: 37.7885,
        lng: -122.4012,
        address: '55 Embarcadero Way',
        landmark: 'Storm Drain #24',
      },
      slaDeadline: new Date(now + 20 * 3600000).toISOString(),
      submittedAt: new Date(now - 2 * 3600000).toISOString(),
      reopenedCount: 0,
      isOverdue: false,
    },
  ];

  const history: IComplaintHistoryItem[] = [
    {
      id: 'hist-1',
      complaintId: 'comp-1001',
      previousStatus: 'Submitted',
      newStatus: 'Under Review',
      changedBy: { id: 'sys', name: 'PeopleFix AI Routing Engine', role: 'admin' },
      publicMessage: 'Complaint registered and assigned automated priority Critical based on safety assessment.',
      createdAt: new Date(now - 8 * 3600000).toISOString(),
    },
    {
      id: 'hist-2',
      complaintId: 'comp-1001',
      previousStatus: 'Under Review',
      newStatus: 'Assigned',
      changedBy: { id: 'user-admin-1', name: 'Sarah Chen (Commissioner)', role: 'admin' },
      publicMessage: 'Assigned to Public Works & Roads department senior field team.',
      internalNote: 'High traffic morning school zone. Expedite cold-mix asphalt patch team.',
      createdAt: new Date(now - 6 * 3600000).toISOString(),
    },
    {
      id: 'hist-3',
      complaintId: 'comp-1001',
      previousStatus: 'Assigned',
      newStatus: 'In Progress',
      changedBy: { id: 'user-officer-roads', name: 'Rajesh Kumar (Roads Lead)', role: 'officer' },
      publicMessage: 'Work crew deployed on site with asphalt compaction equipment. Expected completion by 4:00 PM.',
      internalNote: 'Vehicle crew #4 dispatched with 2 tons asphalt.',
      createdAt: new Date(now - 2 * 3600000).toISOString(),
    },
    {
      id: 'hist-4',
      complaintId: 'comp-1004',
      previousStatus: 'Submitted',
      newStatus: 'Resolved',
      changedBy: { id: 'user-officer-electrical', name: 'Officer Amit Patel', role: 'officer' },
      publicMessage: 'Replaced ballast and fitted 3 new 70W high-efficiency LED luminaires.',
      evidenceImages: [
        'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80',
      ],
      createdAt: new Date(now - 24 * 3600000).toISOString(),
    },
  ];

  const notifications: INotification[] = [
    {
      id: 'notif-1',
      userId: 'user-citizen-1',
      complaintId: 'comp-1001',
      title: 'Crew Deployed on Your Issue',
      message: 'Work crew has arrived to address CF-2026-1001 (Oak Street pothole).',
      type: 'status_change',
      isRead: false,
      link: '/complaints/comp-1001',
      createdAt: new Date(now - 2 * 3600000).toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-officer-roads',
      complaintId: 'comp-1001',
      title: 'Critical Complaint Assigned',
      message: 'Complaint CF-2026-1001 requires expedited attention within 12 hours.',
      type: 'assignment',
      isRead: false,
      link: '/complaints/comp-1001',
      createdAt: new Date(now - 6 * 3600000).toISOString(),
    },
    {
      id: 'notif-3',
      userId: 'user-admin-1',
      complaintId: 'comp-1003',
      title: 'SLA Escalation Alert',
      message: 'Complaint CF-2026-1003 (Main pipeline water leak) has breached SLA deadline.',
      type: 'escalation',
      isRead: false,
      link: '/complaints/comp-1003',
      createdAt: new Date(now - 2 * 3600000).toISOString(),
    },
  ];

  const escalations: IEscalation[] = [
    {
      id: 'esc-1',
      complaintId: 'comp-1003',
      fromOfficerId: 'user-officer-water',
      toOfficerId: 'user-admin-1',
      reason: 'SLA deadline expired. Pipe rupture requires municipal emergency excavation permit.',
      escalationLevel: 2,
      status: 'Active',
      createdAt: new Date(now - 2 * 3600000).toISOString(),
    },
  ];

  const auditLogs: IAuditLog[] = [
    {
      id: 'audit-1',
      actorId: 'user-admin-1',
      actorName: 'Sarah Chen (Commissioner)',
      actorRole: 'admin',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'department',
      entityId: 'all',
      metadata: { initializedDepartments: 6 },
      timestamp: new Date(now - 86400000).toISOString(),
    },
    {
      id: 'audit-2',
      actorId: 'user-citizen-1',
      actorName: 'Alex Johnson',
      actorRole: 'citizen',
      action: 'COMPLAINT_CREATED',
      entityType: 'complaint',
      entityId: 'comp-1001',
      metadata: { priority: 'Critical', category: 'Road Damage / Potholes' },
      timestamp: new Date(now - 8 * 3600000).toISOString(),
    },
  ];

  const initialData: CivicFixDbData = {
    users,
    departments,
    complaints,
    history,
    notifications,
    escalations,
    auditLogs,
  };

  saveToDisk(initialData);
  return initialData;
}

async function loadOrSeedData(): Promise<CivicFixDbData> {
  if (memoryDb) return memoryDb;
  const existing = loadFromDisk();
  if (existing && existing.users && existing.users.length > 0) {
    memoryDb = existing;
    return existing;
  }
  memoryDb = await seedInitialData();
  return memoryDb;
}

// Database helper functions
export const db = {
  get data(): CivicFixDbData {
    if (!memoryDb) {
      const diskData = loadFromDisk();
      if (diskData) memoryDb = diskData;
      else {
        throw new Error('Database not initialized');
      }
    }
    return memoryDb;
  },

  save() {
    if (memoryDb) {
      saveToDisk(memoryDb);
    }
  },

  // User queries
  users: {
    find: (predicate?: (u: IUser) => boolean) => {
      const list = db.data.users;
      return predicate ? list.filter(predicate) : list;
    },
    findById: (id: string) => db.data.users.find((u) => u.id === id),
    findByEmail: (email: string) =>
      db.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    create: (user: IUser) => {
      db.data.users.push(user);
      db.save();
      return user;
    },
    update: (id: string, updates: Partial<IUser>) => {
      const idx = db.data.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        db.data.users[idx] = { ...db.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
        db.save();
        return db.data.users[idx];
      }
      return null;
    },
  },

  // Departments
  departments: {
    find: (predicate?: (d: IDepartment) => boolean) => {
      const list = db.data.departments;
      return predicate ? list.filter(predicate) : list;
    },
    findById: (id: string) => db.data.departments.find((d) => d.id === id),
    findByCategory: (category: ComplaintCategory) =>
      db.data.departments.find((d) => d.categories.includes(category)),
    create: (dept: IDepartment) => {
      db.data.departments.push(dept);
      db.save();
      return dept;
    },
    update: (id: string, updates: Partial<IDepartment>) => {
      const idx = db.data.departments.findIndex((d) => d.id === id);
      if (idx !== -1) {
        db.data.departments[idx] = { ...db.data.departments[idx], ...updates };
        db.save();
        return db.data.departments[idx];
      }
      return null;
    },
  },

  // Complaints
  complaints: {
    find: (predicate?: (c: IComplaint) => boolean) => {
      const list = db.data.complaints;
      return predicate ? list.filter(predicate) : list;
    },
    findById: (id: string) =>
      db.data.complaints.find((c) => c.id === id || c.complaintId.toLowerCase() === id.toLowerCase()),
    create: (complaint: IComplaint) => {
      db.data.complaints.unshift(complaint);
      db.save();
      return complaint;
    },
    update: (id: string, updates: Partial<IComplaint>) => {
      const idx = db.data.complaints.findIndex((c) => c.id === id || c.complaintId === id);
      if (idx !== -1) {
        db.data.complaints[idx] = { ...db.data.complaints[idx], ...updates };
        db.save();
        return db.data.complaints[idx];
      }
      return null;
    },
  },

  // History
  history: {
    findByComplaintId: (complaintId: string) =>
      db.data.history
        .filter((h) => h.complaintId === complaintId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    create: (item: IComplaintHistoryItem) => {
      db.data.history.push(item);
      db.save();
      return item;
    },
  },

  // Notifications
  notifications: {
    findByUserId: (userId: string, role?: string) =>
      db.data.notifications
        .filter((n) => n.userId === userId || (n.roleTarget && n.roleTarget === role))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    create: (notification: INotification) => {
      db.data.notifications.unshift(notification);
      db.save();
      return notification;
    },
    markAsRead: (id: string) => {
      const item = db.data.notifications.find((n) => n.id === id);
      if (item) {
        item.isRead = true;
        db.save();
      }
    },
    markAllAsRead: (userId: string) => {
      db.data.notifications.forEach((n) => {
        if (n.userId === userId) n.isRead = true;
      });
      db.save();
    },
  },

  // Escalations
  escalations: {
    find: (predicate?: (e: IEscalation) => boolean) => {
      const list = db.data.escalations;
      return predicate ? list.filter(predicate) : list;
    },
    create: (escalation: IEscalation) => {
      db.data.escalations.unshift(escalation);
      db.save();
      return escalation;
    },
    update: (id: string, updates: Partial<IEscalation>) => {
      const idx = db.data.escalations.findIndex((e) => e.id === id);
      if (idx !== -1) {
        db.data.escalations[idx] = { ...db.data.escalations[idx], ...updates };
        db.save();
        return db.data.escalations[idx];
      }
      return null;
    },
  },

  // Audit Logs
  auditLogs: {
    find: (limit = 100) => {
      return [...db.data.auditLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    create: (log: IAuditLog) => {
      db.data.auditLogs.unshift(log);
      db.save();
      return log;
    },
  },
};
