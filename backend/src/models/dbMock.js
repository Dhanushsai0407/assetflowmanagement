const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const dataDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper to read and write database collections
const getCollectionPath = (name) => path.join(dataDir, `${name.toLowerCase()}s.json`);

const readCollection = (name) => {
  const filePath = getCollectionPath(name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const writeCollection = (name, data) => {
  fs.writeFileSync(getCollectionPath(name), JSON.stringify(data, null, 2));
};

// Simulated Promise query chain
class QueryChain {
  constructor(data, collectionName) {
    this.data = data;
    this.collectionName = collectionName;
  }

  populate(pathStr, selectFields) {
    if (!this.data) return this;
    
    const isArray = Array.isArray(this.data);
    const items = isArray ? this.data : [this.data];

    // Determine target collection based on populate key
    let targetCollection = '';
    if (pathStr === 'department' || pathStr === 'allocatedDepartment' || pathStr === 'scopeDepartment' || pathStr === 'parentDepartment') {
      targetCollection = 'Department';
    } else if (pathStr === 'category') {
      targetCollection = 'Category';
    } else if (pathStr === 'user' || pathStr === 'allocatedTo' || pathStr === 'allocatedBy' || pathStr === 'reportedBy' || pathStr === 'auditors' || pathStr === 'auditor' || pathStr === 'departmentHead' || pathStr === 'fromUser' || pathStr === 'toUser' || pathStr === 'bookedBy' || pathStr === 'requestedBy' || pathStr === 'approvedBy') {
      targetCollection = 'User';
    } else if (pathStr === 'asset' || pathStr === 'resource') {
      targetCollection = 'Asset';
    } else if (pathStr === 'auditCycle') {
      targetCollection = 'AuditCycle';
    }

    if (targetCollection) {
      const referencedData = readCollection(targetCollection);
      items.forEach((item) => {
        if (!item) return;
        const refId = item[pathStr];
        
        if (refId) {
          if (Array.isArray(refId)) {
            // Handle array references (e.g. auditors)
            item[pathStr] = refId.map(id => referencedData.find(r => String(r._id) === String(id))).filter(Boolean);
          } else {
            // Single reference
            const populated = referencedData.find(r => String(r._id) === String(refId));
            if (populated) {
              item[pathStr] = JSON.parse(JSON.stringify(populated)); // clone to avoid reference issues
            }
          }
        }
      });
    }

    // Support nested population
    // e.g. path: { path: 'asset', populate: { path: 'category' } }
    if (typeof pathStr === 'object' && pathStr.path) {
      const subPath = pathStr.path;
      this.populate(subPath);
      if (pathStr.populate) {
        items.forEach(item => {
          if (item && item[subPath]) {
            const subChain = new QueryChain(item[subPath], '');
            subChain.populate(pathStr.populate.path);
          }
        });
      }
    }

    return this;
  }

  select(fields) {
    // Select simulation (e.g. +password or -password)
    return this;
  }

  sort(sortOption) {
    if (!Array.isArray(this.data)) return this;
    const keys = Object.keys(sortOption);
    if (keys.length === 0) return this;

    const key = keys[0];
    const direction = sortOption[key]; // 1 for asc, -1 for desc

    this.data.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA === valB) return 0;
      if (valA < valB) return direction === 1 ? -1 : 1;
      return direction === 1 ? 1 : -1;
    });

    return this;
  }

  skip(num) {
    if (Array.isArray(this.data)) {
      this.data = this.data.slice(num);
    }
    return this;
  }

  limit(num) {
    if (Array.isArray(this.data)) {
      this.data = this.data.slice(0, num);
    }
    return this;
  }

  then(resolve, reject) {
    resolve(this.data);
  }

  catch(reject) {
    // dummy catch
    return this;
  }
}

// Basic Schema Mock
class Schema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
    this._preHooks = {};
    this.methods = {};
  }

  pre(hook, fn) {
    this._preHooks[hook] = fn;
  }
}

Schema.Types = {
  ObjectId: 'ObjectId',
  Mixed: 'Mixed',
};

// Model Class Simulator
class Model {
  constructor(collectionName, schema) {
    this.collectionName = collectionName;
    this.schema = schema;
  }

  // General query helper matching key-value constraints
  _matches(item, query) {
    for (const key in query) {
      if (key === '$or') {
        const matched = query.$or.some((subQuery) => this._matches(item, subQuery));
        if (!matched) return false;
        continue;
      }
      
      const filter = query[key];
      
      if (filter && typeof filter === 'object' && !Array.isArray(filter)) {
        // Handle MongoDB operators: $regex, $options, $in, $nin, $ne, $lt, $gte
        if (filter.hasOwnProperty('$regex')) {
          const regex = new RegExp(filter.$regex, filter.$options || '');
          if (!regex.test(String(item[key] || ''))) return false;
        } else if (filter.hasOwnProperty('$in')) {
          if (!filter.$in.includes(item[key])) return false;
        } else if (filter.hasOwnProperty('$nin')) {
          if (filter.$nin.includes(item[key])) return false;
        } else if (filter.hasOwnProperty('$ne')) {
          if (String(item[key]) === String(filter.$ne)) return false;
        } else if (filter.hasOwnProperty('$lt')) {
          if (new Date(item[key]) >= new Date(filter.$lt)) return false;
        } else if (filter.hasOwnProperty('$lte')) {
          if (new Date(item[key]) > new Date(filter.$lte)) return false;
        } else if (filter.hasOwnProperty('$gte')) {
          if (new Date(item[key]) < new Date(filter.$gte)) return false;
        }
      } else {
        // Direct equal match
        if (String(item[key] || '') !== String(filter || '')) {
          return false;
        }
      }
    }
    return true;
  }

  find(query = {}) {
    const list = readCollection(this.collectionName);
    const filtered = list.filter((item) => this._matches(item, query));
    return new QueryChain(filtered, this.collectionName);
  }

  findOne(query = {}) {
    const list = readCollection(this.collectionName);
    const item = list.find((item) => this._matches(item, query));
    return new QueryChain(item || null, this.collectionName);
  }

  findById(id) {
    const list = readCollection(this.collectionName);
    const item = list.find((item) => String(item._id) === String(id));
    
    // Add instance method support like item.save()
    if (item) {
      item.save = async () => {
        const fullList = readCollection(this.collectionName);
        const idx = fullList.findIndex((x) => String(x._id) === String(item._id));
        if (idx !== -1) {
          // Pre-save triggers (e.g. hashing password)
          if (this.schema && this.schema._preHooks['save']) {
            item.isModified = (field) => true;
            await this.schema._preHooks['save'].call(item, () => {});
            delete item.isModified;
          }
          fullList[idx] = item;
          writeCollection(this.collectionName, fullList);
        }
        return item;
      };
      
      // Inject schema level methods
      if (this.schema?.methods) {
        Object.keys(this.schema.methods).forEach((methodName) => {
          item[methodName] = this.schema.methods[methodName].bind(item);
        });
      }
    }
    return new QueryChain(item || null, this.collectionName);
  }

  async create(data) {
    const list = readCollection(this.collectionName);
    const doc = {
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };

    // Pre-save hooks
    if (this.schema && this.schema._preHooks['save']) {
      doc.isModified = (field) => true;
      await this.schema._preHooks['save'].call(doc, () => {});
      delete doc.isModified;
    }

    list.push(doc);
    writeCollection(this.collectionName, list);
    
    // Inject save method
    doc.save = async () => {
      const fullList = readCollection(this.collectionName);
      const idx = fullList.findIndex((x) => String(x._id) === String(doc._id));
      if (idx !== -1) {
        fullList[idx] = doc;
        writeCollection(this.collectionName, fullList);
      }
      return doc;
    };
    return doc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const list = readCollection(this.collectionName);
    const idx = list.findIndex((x) => String(x._id) === String(id));
    if (idx === -1) return null;

    const item = list[idx];
    const updated = {
      ...item,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    writeCollection(this.collectionName, list);
    return updated;
  }

  async findByIdAndDelete(id) {
    const list = readCollection(this.collectionName);
    const filtered = list.filter((x) => String(x._id) !== String(id));
    writeCollection(this.collectionName, filtered);
    return { success: true };
  }

  async countDocuments(query = {}) {
    const list = readCollection(this.collectionName);
    const filtered = list.filter((item) => this._matches(item, query));
    return filtered.length;
  }

  async updateMany(query = {}, update = {}) {
    const list = readCollection(this.collectionName);
    list.forEach((item) => {
      if (this._matches(item, query)) {
        Object.assign(item, update, { updatedAt: new Date().toISOString() });
      }
    });
    writeCollection(this.collectionName, list);
    return { modifiedCount: list.length };
  }

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      writeCollection(this.collectionName, []);
    } else {
      const list = readCollection(this.collectionName);
      const remaining = list.filter((item) => !this._matches(item, query));
      writeCollection(this.collectionName, remaining);
    }
    return { deletedCount: 0 };
  }

  async insertMany(arrayData) {
    const list = readCollection(this.collectionName);
    const added = arrayData.map((item) => ({
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item,
    }));
    const combined = [...list, ...added];
    writeCollection(this.collectionName, combined);
    return added;
  }
}

// Mongoose interface simulator
const dbMock = {
  Schema: Schema,
  Types: {
    ObjectId: (id) => id || Math.random().toString(36).substr(2, 9)
  },
  model: (name, schema) => {
    return new Model(name, schema);
  },
  connect: async () => {
    console.log('MOCK DATABASE: Local persistent storage online at data/*.json');
    return { connection: { host: 'file-persistence-offline-mode' } };
  },
};

module.exports = dbMock;
