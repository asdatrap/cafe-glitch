const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Файл с меню
const menuFile = path.join(__dirname, 'menu.json');

// Инициализация меню
if (!fs.existsSync(menuFile)) {
  const initialMenu = [
    { id: 1, name: "Капучино", price: 109, category: "coffee", available: true },
    { id: 2, name: "Латте", price: 119, category: "coffee", available: true },
    { id: 3, name: "Эспрессо", price: 60, category: "coffee", available: true },
    { id: 4, name: "Чай", price: 40, category: "tea", available: true },
    { id: 5, name: "Пирожное", price: 70, category: "dessert", available: true }
  ];
  fs.writeFileSync(menuFile, JSON.stringify(initialMenu, null, 2));
}

// CORS для всех
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// API Routes
app.get('/api/menu', (req, res) => {
  try {
    const menu = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/menu/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { price, name, available } = req.body;
    
    const menu = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
    const itemIndex = menu.findIndex(item => item.id == id);
    
    if (itemIndex !== -1) {
      if (price !== undefined) menu[itemIndex].price = price;
      if (name !== undefined) menu[itemIndex].name = name;
      if (available !== undefined) menu[itemIndex].available = available;
      menu[itemIndex].updatedAt = new Date().toISOString();
      
      fs.writeFileSync(menuFile, JSON.stringify(menu, null, 2));
      res.json(menu[itemIndex]);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu', (req, res) => {
  try {
    const { name, price, category } = req.body;
    const menu = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
    
    const newItem = {
      id: Date.now(),
      name,
      price,
      category: category || 'other',
      available: true,
      createdAt: new Date().toISOString()
    };
    
    menu.push(newItem);
    fs.writeFileSync(menuFile, JSON.stringify(menu, null, 2));
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/menu/:id', (req, res) => {
  try {
    const { id } = req.params;
    const menu = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
    
    const filteredMenu = menu.filter(item => item.id != id);
    fs.writeFileSync(menuFile, JSON.stringify(filteredMenu, null, 2));
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Главная страница - админ-панель
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
