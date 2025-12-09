# TravelGo - Travel Management System

**Course:** BIC2124 Information Management for Mobile Computing  
**Lecturer:** Assoc. Prof. Dr. Chloe Thong Chee Ling  
**Submission Date:** 23 November 2025

## 1. Project Overview
TravelGo is a web-based Travel Management System designed to help users book hotels and flights. It is a fully functional **CRUD (Create, Read, Update, Delete)** application built using the **MEN Stack** (MongoDB, Express.js, Node.js).

### Key Features
* **Create:** Book new hotels and flights via responsive forms.
* **Read:** View all active bookings in the "My Bookings" dashboard.
* **Delete:** Remove bookings from the database with a safety confirmation check.
* **Validation:** Prevents duplicate passport numbers and ensures valid dates.
* **Persistence:** All data is stored in a local MongoDB database.

---

## 2. Group Members

| Student Name | Student ID | Role |
| :--- | :--- | :--- |
| **Ronald Lee Kai Ren** | 1002162634 | Project Manager / Video |
| **Lee Ho Yi** | (ID) | Frontend Lead |
| **ZengYu** | 1002577594 | Backend Lead |
| **Dai Ziqiu** | 1002371743 | Integration Dev |

---

## 3. Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **ODM:** Mongoose

---

## 4. Prerequisites
Before running this project, ensure you have the following installed on your machine:
1.  **Node.js** (v14 or higher)
2.  **MongoDB Community Server** (running locally on port `27017`)

---

## 5. Installation & Setup

### Step 1: Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
````

### Step 2: Start MongoDB

Ensure your local MongoDB instance is running.

  * *Windows:* Open Task Manager/Services or run `mongod` in a terminal.
  * *Mac/Linux:* Run `brew services start mongodb-community`.

### Step 3: Seed the Database

We have provided a seed script to populate the database with 8 sample users (as required by the assignment).

```bash
node seed.js
```

*You should see a message: `>>> 8 Sample bookings inserted successfully!`*

-----

## 6\. How to Run the App

1.  **Start the Backend Server**
    Run the following command in your terminal:

    ```bash
    node server.js
    ```

    *Output should be: `Server running on http://localhost:3000`*

2.  **Launch the Frontend**

      * Open the `index.html` file in your browser (Chrome/Edge/Firefox).
      * You can double-click the file or use a Live Server extension.

-----

## 7\. API Endpoints (Backend)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/bookings` | Fetch all booking records |
| **POST** | `/api/bookings` | Create a new booking |
| **PUT** | `/api/bookings/:id` | Update a booking (available via API) |
| **DELETE** | `/api/bookings/:id` | Delete a specific booking |

-----

## 8\. Validation Rules

  * **Passport Number:** Must be unique. Duplicates will trigger an alert.
  * **Dates:** Check-out date must be after Check-in date.
  * **Required Fields:** All personal details and destination fields are mandatory.
