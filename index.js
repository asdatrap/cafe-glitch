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
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель меню</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .menu-item { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .menu-item input { width: 100px; padding: 5px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
        .menu-item input[type="text"] { width: 200px; }
        .btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #45a049; }
        .btn-danger { background: #f44336; }
        .btn-danger:hover { background: #da190b; }
        .add-item { background: #e8f5e8; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .status { text-align: center; padding: 10px; margin: 10px 0; border-radius: 4px; display: none; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍽️ Админ-панель меню</h1>
        <div id="status" class="status"></div>
        <div id="menu-list"></div>
        <div class="add-item">
            <h3>Добавить новый товар</h3>
            <input type="text" id="new-name" placeholder="Название">
            <input type="number" id="new-price" placeholder="Цена">
            <input type="text" id="new-category" placeholder="Категория">
            <button class="btn" onclick="addItem()">Добавить</button>
        </div>
    </div>
    <script>
        let menu = [];
        
        async function loadMenu() {
            try {
                const response = await fetch('/api/menu');
                menu = await response.json();
                renderMenu();
            } catch (error) {
                showStatus('Ошибка загрузки меню', 'error');
            }
        }
        
        function renderMenu() {
            const menuList = document.getElementById('menu-list');
            menuList.innerHTML = '';
            
            menu.forEach(item => {
                const div = document.createElement('div');
                div.className = 'menu-item';
                div.innerHTML = \`
                    <strong>ID: \${item.id}</strong><br>
                    <input type="text" value="\${item.name}" id="name-\${item.id}" placeholder="Название">
                    <input type="number" value="\${item.price}" id="price-\${item.id}" placeholder="Цена">
                    <input type="text" value="\${item.category}" id="category-\${item.id}" placeholder="Категория">
                    <label><input type="checkbox" \${item.available ? 'checked' : ''} id="available-\${item.id}"> Доступен</label><br>
                    <button class="btn" onclick="updateItem(\${item.id})">Сохранить</button>
                    <button class="btn btn-danger" onclick="deleteItem(\${item.id})">Удалить</button>
                \`;
                menuList.appendChild(div);
            });
        }
        
        async function updateItem(id) {
            try {
                const name = document.getElementById(\`name-\${id}\`).value;
                const price = parseFloat(document.getElementById(\`price-\${id}\`).value);
                const category = document.getElementById(\`category-\${id}\`).value;
                const available = document.getElementById(\`available-\${id}\`).checked;
                
                const response = await fetch(\`/api/menu/\${id}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, price, category, available })
                });
                
                if (response.ok) {
                    showStatus('Товар обновлен!', 'success');
                    await loadMenu();
                } else {
                    showStatus('Ошибка обновления', 'error');
                }
            } catch (error) {
                showStatus('Ошибка соединения', 'error');
            }
        }
        
        async function deleteItem(id) {
            if (confirm('Удалить этот товар?')) {
                try {
                    const response = await fetch(\`/api/menu/\${id}\`, { method: 'DELETE' });
                    if (response.ok) {
                        showStatus('Товар удален!', 'success');
                        await loadMenu();
                    } else {
                        showStatus('Ошибка удаления', 'error');
                    }
                } catch (error) {
                    showStatus('Ошибка соединения', 'error');
                }
            }
        }
        
        async function addItem() {
            try {
                const name = document.getElementById('new-name').value;
                const price = parseFloat(document.getElementById('new-price').value);
                const category = document.getElementById('new-category').value || 'other';
                
                if (!name || !price) {
                    showStatus('Заполните название и цену', 'error');
                    return;
                }
                
                const response = await fetch('/api/menu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, price, category })
                });
                
                if (response.ok) {
                    showStatus('Товар добавлен!', 'success');
                    document.getElementById('new-name').value = '';
                    document.getElementById('new-price').value = '';
                    document.getElementById('new-category').value = '';
                    await loadMenu();
                } else {
                    showStatus('Ошибка добавления', 'error');
                }
            } catch (error) {
                showStatus('Ошибка соединения', 'error');
            }
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = \`status \${type}\`;
            status.style.display = 'block';
            setTimeout(() => { status.style.display = 'none'; }, 3000);
        }
        
        loadMenu();
        setInterval(loadMenu, 30000);
    </script>
</body>
</html>
  `);
});

module.exports = app;
