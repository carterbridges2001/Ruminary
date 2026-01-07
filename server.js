const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Database file path
const DB_PATH = path.join(__dirname, 'database.json');

// Helper function to read database
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { items: [] };
    }
}

// Helper function to write database
async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
}

// API Routes

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const db = await readDatabase();
        res.json(db.items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Add new item
app.post('/api/items', upload.single('image'), async (req, res) => {
    try {
        const db = await readDatabase();
        const newItem = {
            id: Date.now(), // Simple ID generation
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description,
            image: req.file ? `images/${req.file.filename}` : 'images/5294293766857341368.jpg.jpeg'
        };
        
        db.items.push(newItem);
        const success = await writeDatabase(db);
        
        if (success) {
            res.json(newItem);
        } else {
            res.status(500).json({ error: 'Failed to save item' });
        }
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update item
app.put('/api/items/:id', upload.single('image'), async (req, res) => {
    try {
        const db = await readDatabase();
        const itemIndex = db.items.findIndex(item => item.id == req.params.id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const updatedItem = {
            ...db.items[itemIndex],
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description
        };
        
        if (req.file) {
            updatedItem.image = `images/${req.file.filename}`;
        }
        
        db.items[itemIndex] = updatedItem;
        const success = await writeDatabase(db);
        
        if (success) {
            res.json(updatedItem);
        } else {
            res.status(500).json({ error: 'Failed to update item' });
        }
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const db = await readDatabase();
        const itemIndex = db.items.findIndex(item => item.id == req.params.id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        db.items.splice(itemIndex, 1);
        const success = await writeDatabase(db);
        
        if (success) {
            res.json({ message: 'Item deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete item' });
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET    /api/items - Get all items`);
    console.log(`  POST   /api/items - Add new item`);
    console.log(`  PUT    /api/items/:id - Update item`);
    console.log(`  DELETE /api/items/:id - Delete item`);
});
