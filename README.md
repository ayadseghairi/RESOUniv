# RESOUniv

Equipment borrowing system built for Université Abbes Laghrour Khenchela.  
Students, professors, and admins can manage device borrowing requests digitally.

## Features

- Role-based access control (student / professor / admin)
- Multilingual interface — Arabic and French
- Device inventory management
- Borrowing request and approval workflow
- Responsive design (mobile + desktop)

## Tech Stack

**Backend:** Python 3.10+, Flask, SQLite, REST API  
**Frontend:** React, Vite, i18next, Boxicons

## Getting Started

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on [http://localhost:5173](http://localhost:5173)

## Project Structure

```
├── backend
│   ├── app/              # Flask application
│   ├── config/           # Configuration files
│   ├── instance/         # SQLite database
│   ├── run.py            # Entry point
│   └── requirements.txt
└── frontend
    ├── src/              # React source
    └── vite.config.js
```

## License

MIT — Built at Université Abbes Laghrour Khenchela
