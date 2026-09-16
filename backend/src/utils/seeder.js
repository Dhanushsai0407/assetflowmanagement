const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const qr = require('qrcode');

// Load environment variables
dotenv.config();

const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const TransferRequest = require('../models/TransferRequest');
const AuditCycle = require('../models/AuditCycle');
const AuditItem = require('../models/AuditItem');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assetflow';

const seed = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(dbUri);
    console.log('Connected to database. Clearing old data...');

    // Clear everything
    await User.deleteMany();
    await Department.deleteMany();
    await Category.deleteMany();
    await Asset.deleteMany();
    await Allocation.deleteMany();
    await Booking.deleteMany();
    await MaintenanceRequest.deleteMany();
    await TransferRequest.deleteMany();
    await AuditCycle.deleteMany();
    await AuditItem.deleteMany();
    await Notification.deleteMany();
    await ActivityLog.deleteMany();

    console.log('Data cleared. Seeding Master Data...');

    // 1. Create Categories with optional custom fields
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        description: 'Electronic devices, gadgets, and accessories',
        customFields: [
          { name: 'Warranty Period (Months)', type: 'Number', required: true },
          { name: 'Power Consumption (W)', type: 'Number', required: false }
        ]
      },
      {
        name: 'Furniture',
        description: 'Office desks, chairs, and cabinets',
        customFields: [
          { name: 'Material', type: 'Text', required: true }
        ]
      },
      {
        name: 'Vehicles',
        description: 'Company vehicles, cars, and shuttles',
        customFields: [
          { name: 'License Plate', type: 'Text', required: true },
          { name: 'Next Service Date', type: 'Date', required: false }
        ]
      },
      {
        name: 'Spaces & Rooms',
        description: 'Meeting rooms, conference halls, and labs',
        customFields: [
          { name: 'Capacity', type: 'Number', required: true }
        ]
      }
    ]);
    console.log(`Seeded ${categories.length} Categories.`);

    // 2. Create Departments
    const engineering = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      status: 'Active',
    });

    const hr = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      status: 'Active',
    });

    const facilities = await Department.create({
      name: 'Facilities & Logistics',
      code: 'FAC',
      status: 'Active',
    });

    console.log('Seeded Departments.');

    // 3. Seed Users
    // Admin
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@assetflow.com',
      password: 'AdminPassword123!',
      role: 'Admin',
      phone: '+1 555-0100',
      status: 'Active',
    });

    // Asset Manager
    const assetManager = await User.create({
      name: 'Sarah Connor',
      email: 'manager@assetflow.com',
      password: 'AdminPassword123!',
      role: 'Asset Manager',
      department: facilities._id,
      phone: '+1 555-0101',
      status: 'Active',
    });

    // Department Head (Engineering)
    const deptHead = await User.create({
      name: 'Priya Sharma',
      email: 'head@assetflow.com',
      password: 'AdminPassword123!',
      role: 'Department Head',
      department: engineering._id,
      phone: '+1 555-0102',
      status: 'Active',
    });

    // Link Priya as the department head of Engineering
    engineering.departmentHead = deptHead._id;
    await engineering.save();

    // Standard Employees
    const employee1 = await User.create({
      name: 'Raj Patel',
      email: 'raj@assetflow.com',
      password: 'AdminPassword123!',
      role: 'Employee',
      department: engineering._id,
      phone: '+1 555-0103',
      status: 'Active',
    });

    const employee2 = await User.create({
      name: 'John Doe',
      email: 'john@assetflow.com',
      password: 'AdminPassword123!',
      role: 'Employee',
      department: hr._id,
      phone: '+1 555-0104',
      status: 'Active',
    });

    console.log('Seeded User Accounts.');

    // 4. Seed Assets
    const qr1 = await qr.toDataURL('AF-000001');
    const qr2 = await qr.toDataURL('AF-000002');
    const qr3 = await qr.toDataURL('AF-000003');
    const qr4 = await qr.toDataURL('AF-000004');
    const qr5 = await qr.toDataURL('AF-000005');

    const laptop = await Asset.create({
      name: 'MacBook Pro 16"',
      assetTag: 'AF-000001',
      serialNumber: 'C02DF43FLVD2',
      category: categories[0]._id, // Electronics
      department: engineering._id,
      location: 'SF Office - Floor 3',
      acquisitionDate: new Date('2025-01-15'),
      acquisitionCost: 2499,
      condition: 'Excellent',
      status: 'Allocated',
      bookable: false,
      qrCodeUrl: qr1,
      customData: {
        'Warranty Period (Months)': 24,
        'Power Consumption (W)': 96
      }
    });

    const desk = await Asset.create({
      name: 'Ergonomic Standing Desk',
      assetTag: 'AF-000002',
      serialNumber: 'ESD-9988-21',
      category: categories[1]._id, // Furniture
      department: engineering._id,
      location: 'SF Office - Bay 4',
      acquisitionDate: new Date('2025-02-10'),
      acquisitionCost: 650,
      condition: 'Good',
      status: 'Allocated',
      bookable: false,
      qrCodeUrl: qr2,
      customData: {
        'Material': 'Oak / Steel Frame'
      }
    });

    const roomB2 = await Asset.create({
      name: 'Conference Room B2',
      assetTag: 'AF-000003',
      serialNumber: 'CR-B2',
      category: categories[3]._id, // Spaces
      location: 'SF Office - Floor 2',
      acquisitionDate: new Date('2024-05-01'),
      acquisitionCost: 0,
      condition: 'Excellent',
      status: 'Available',
      bookable: true,
      qrCodeUrl: qr3,
      customData: {
        'Capacity': 12
      }
    });

    const projector = await Asset.create({
      name: '4K Laser Projector',
      assetTag: 'AF-000004',
      serialNumber: 'PROJ-LSR-88',
      category: categories[0]._id, // Electronics
      location: 'Equipment Locker A',
      acquisitionDate: new Date('2025-03-20'),
      acquisitionCost: 1200,
      condition: 'Excellent',
      status: 'Available',
      bookable: true,
      qrCodeUrl: qr4,
      customData: {
        'Warranty Period (Months)': 12,
        'Power Consumption (W)': 350
      }
    });

    const shuttle = await Asset.create({
      name: 'Tesla Model Y Shuttle',
      assetTag: 'AF-000005',
      serialNumber: '5YJYGDEE7LF',
      category: categories[2]._id, // Vehicles
      location: 'Basement Parking Slot 14',
      acquisitionDate: new Date('2024-09-12'),
      acquisitionCost: 45000,
      condition: 'Excellent',
      status: 'Available',
      bookable: true,
      qrCodeUrl: qr5,
      customData: {
        'License Plate': 'SF-GO-ELEV',
        'Next Service Date': new Date('2026-10-15')
      }
    });

    const vr = await Asset.create({
      name: 'Oculus Vision VR Kit',
      assetTag: 'AF-000006',
      serialNumber: 'OC-VIS-7711',
      category: categories[0]._id, // Electronics
      location: 'Equipment Locker B',
      acquisitionDate: new Date('2025-04-10'),
      acquisitionCost: 1500,
      condition: 'Excellent',
      status: 'Available',
      bookable: true,
      qrCodeUrl: await qr.toDataURL('AF-000006'),
      customData: {
        'Warranty Period (Months)': 12,
        'Power Consumption (W)': 45
      }
    });

    const execRoom = await Asset.create({
      name: 'Executive Boardroom C1',
      assetTag: 'AF-000007',
      serialNumber: 'CR-C1',
      category: categories[3]._id, // Spaces
      location: 'SF Office - Floor 4',
      acquisitionDate: new Date('2024-06-01'),
      acquisitionCost: 0,
      condition: 'Excellent',
      status: 'Available',
      bookable: true,
      qrCodeUrl: await qr.toDataURL('AF-000007'),
      customData: {
        'Capacity': 20
      }
    });

    const auditorium = await Asset.create({
      name: 'Town Hall Auditorium',
      assetTag: 'AF-000008',
      serialNumber: 'AUD-TH',
      category: categories[3]._id, // Spaces
      location: 'SF Office - Ground Floor',
      acquisitionDate: new Date('2024-01-10'),
      acquisitionCost: 0,
      condition: 'Excellent',
      status: 'Available',
      bookable: true,
      qrCodeUrl: await qr.toDataURL('AF-000008'),
      customData: {
        'Capacity': 150
      }
    });

    console.log('Seeded Assets.');

    // 5. Seed Allocations
    await Allocation.create({
      asset: laptop._id,
      allocatedTo: deptHead._id,
      allocatedBy: assetManager._id,
      allocatedDepartment: engineering._id,
      allocationDate: new Date('2025-01-20'),
      expectedReturnDate: new Date('2027-01-20'),
      status: 'Active',
      notes: 'Initial allocation for Engineering Head Priya Sharma'
    });

    await Allocation.create({
      asset: desk._id,
      allocatedTo: employee1._id,
      allocatedBy: assetManager._id,
      allocatedDepartment: engineering._id,
      allocationDate: new Date('2025-02-15'),
      expectedReturnDate: null,
      status: 'Active',
      notes: 'Assigned to Raj Patel desk space'
    });

    console.log('Seeded Allocations.');

    // 6. Seed Bookings
    const today = new Date();
    
    // Booking 1: B2 Room booked from 10:00 to 11:30 Today
    const b1Start = new Date(today);
    b1Start.setHours(10, 0, 0);
    const b1End = new Date(today);
    b1End.setHours(11, 30, 0);

    await Booking.create({
      resource: roomB2._id,
      bookedBy: deptHead._id,
      bookedDepartment: engineering._id,
      title: 'Weekly Sync meeting',
      startTime: b1Start,
      endTime: b1End,
      status: 'Upcoming'
    });

    // Booking 2: Shuttle booked from 14:00 to 16:00 Today
    const b2Start = new Date(today);
    b2Start.setHours(14, 0, 0);
    const b2End = new Date(today);
    b2End.setHours(16, 0, 0);

    await Booking.create({
      resource: shuttle._id,
      bookedBy: employee2._id,
      bookedDepartment: hr._id,
      title: 'Candidate pickup airport',
      startTime: b2Start,
      endTime: b2End,
      status: 'Upcoming'
    });

    console.log('Seeded Bookings.');

    // 7. Seed Activity Logs
    await ActivityLog.create({
      user: adminUser._id,
      action: 'SYSTEM_SEED',
      module: 'Database',
      details: 'Initial corporate master tables and records seeded successfully.',
      ipAddress: '127.0.0.1'
    });

    console.log('Seeding Complete! Exiting...');
    process.exit(0);
  } catch (err) {
    console.error(`Seeding error: ${err.message}`);
    process.exit(1);
  }
};

seed();
