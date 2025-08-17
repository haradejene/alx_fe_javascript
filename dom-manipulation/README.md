# Dynamic Quote Generator

The **Dynamic Quote Generator** is a web application that allows users to create, view, filter, and manage quotes. It uses **Web Storage (Local Storage & Session Storage)** to persist data locally and includes **JSON import/export functionality**. Additionally, it features a **category-based filtering system** and **server synchronization simulation** with conflict resolution.

---

## 🚀 Features

- **Add & View Quotes**  
  Users can add custom quotes with categories and view them dynamically.

- **Persistent Storage**  
  - **Local Storage**: Quotes are saved and reloaded across browser sessions.  
  - **Session Storage**: Last viewed quote or user preferences can be stored temporarily.

- **JSON Import & Export**  
  - Export quotes to a `.json` file.  
  - Import quotes from a `.json` file.  

- **Category Filtering**  
  - Filter quotes by category using a dropdown.  
  - Categories are dynamically populated and persisted.  
  - Last selected filter is remembered across sessions.

- **Server Sync Simulation**  
  - Periodic syncing with a mock API (e.g., JSONPlaceholder).  
  - Conflict resolution strategy: **server data takes precedence**.  
  - UI notification system alerts users of updates.  
  - Option for manual conflict resolution (future enhancement).

---

## 🛠️ Technologies Used

- **HTML5** – Structure of the application  
- **CSS3** – Styling (optional custom styles)  
- **JavaScript (ES6)** – Core logic and interactivity  
- **Web Storage API** – Local Storage & Session Storage  
- **FileReader API** – Importing JSON data  
- **Blob API** – Exporting JSON data  
- **Fetch API** – Server sync simulation (using mock APIs like JSONPlaceholder)

---

