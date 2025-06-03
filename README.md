# 📚 RESOUniv – University Borrowing System for Khenchela

RESOUniv is a web-based equipment borrowing system developed for **Université Abbes Laghrour Khenchela**. It enables students, professors, and administrative staff to manage the borrowing and return of university-owned devices and materials in a streamlined, digital way.

---

## ✨ Features

- 🔐 **User Authentication** – Secure login for different user roles (students, teachers, admins)
- 🎓 **Student & Staff Dashboards** – View borrow history, submit and manage requests
- 🧑‍💼 **Admin Panel** – Manage users, devices, borrowing approvals, and system settings
- 🌐 **Multilingual Interface** – Available in Arabic 🇩🇿 and French 🇫🇷
- 🧩 **Role-Based Access Control** – Frontend & backend protected routes
- 🧾 **Device Inventory System** – Add, update, delete, and monitor devices
- 📱 **Responsive Design** – Fully usable on mobile and desktop
- 🧠 **Modern Tech Stack** – Fast and maintainable with React and Flask

---

## 🧰 Tech Stack

### Backend
- Python 3.10+ with Flask
- SQLite (development database)
- RESTful API structure
- JSON config for environment setup

### Frontend
- React.js with Vite
- i18next for translations
- Boxicons for icons
- CSS + responsive layout

---

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js + npm

---

### 🔧 Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
````

You can modify configurations in:

```bash
backend/config/development_config.json
```

The SQLite DB file is located at:

```bash
backend/instance/database.db
```

---

### 💻 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

This will start the React app on [http://localhost:5173](http://localhost:5173).

---

## 🌍 Translations

The frontend supports multiple languages:

* `src/locales/ar/translation.json` – Arabic
* `src/locales/fr/translation.json` – French

To add more languages, follow the i18next structure in `src/i18n.js`.

---

## 📂 Project Structure

```
.
├── backend
│   ├── app/                  # Flask app
│   ├── config/               # App configuration files
│   ├── instance/             # SQLite database
│   ├── scripts/              # Helper scripts (config, setup)
│   ├── run.py                # Main entrypoint
│   └── requirements.txt      # Python dependencies
└── frontend
    ├── src/                  # React source code
    ├── public/               # Static assets
    ├── index.html            # Main HTML entry
    └── vite.config.js        # Vite configuration
```

---

## 🛡️ License

This project is licensed under the MIT License.

---

## 🤝 Acknowledgments

This project is developed by students of **Université Abbes Laghrour Khenchela** to support the digital transformation of academic administration.
Thanks to all contributors and professors who supported the project.
