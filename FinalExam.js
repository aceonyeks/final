const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const { stdin } = require('process');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Ogechi1561!',
    database: 'Library4'
});

// Function to get a connection from the pool
const getConnection = () => pool.promise();

// Serve static files (CSS, JavaScript, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the front-end index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Borrow Book Endpoint
app.post('/borrow', async (req, res) => {
    const { student_id, book_id } = req.body;

    if (!student_id || !book_id) {
        return res.status(400).json({ error: 'Student ID and Book ID are required.' });
    }

    try {
        const [book] = await getConnection().query(
            'SELECT book_id, book_title, isbn, publisher_id, book_format, pages, published, year FROM Books WHERE book_id = ? AND checked_out = FALSE', 
            [book_id]
        );

        if (book.length === 0) {
            return res.status(400).json({ error: 'Book is not available for borrowing.' });
        }

        const [student] = await getConnection().query(
            'SELECT * FROM Students WHERE student_id = ?', 
            [student_id]
        );

        if (student.length === 0) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        await getConnection().query(
            'UPDATE Books SET checked_out = TRUE WHERE book_id = ?', 
            [book_id]
        );

        const borrowedBook = book[0];
        res.status(200).json({ 
            message: `Book borrowed successfully by student ${student[0].first_name} ${student[0].last_name}.`,
            bookDetails: borrowedBook
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// group names for a user
app.post("/groups", async (req, res) => {
    const { student_id } = req.body;

    if (!student_id) {
        res.status(400).json({error: "student ID is not valid!!"});
    }

    try {
        const [student] = await getConnection().query(
            "SELECT * FROM Students WHERE student_id = ?",
            [student_id]
        );

        if (!student || student.length === 0) {
            return res.status(400)
        }

        const [groups] = await getConnection().query(
            "SELECT group_name FROM StudentGroups WHERE group_name = ?",
            [student[0].group_name]
        );

        console.log(`group data: ${groups}`)

        if (!groups || groups.length === 0) {
            return res.status(400).json({ error: "Group not found." });
        }

        res.status(200).json({ message: `Group for user ID ${student_id}: ${groups[0].group_name}` }); 
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error." });
    }
})

//connect to a "global" host like AWS or Github pages


// Return Book Endpoint
app.post('/return', async (req, res) => {
    const { student_id, book_id } = req.body;

    if (!student_id || !book_id) {
        return res.status(400).json({ error: 'Student ID and Book ID are required.' });
    }

    try {
        const [book] = await getConnection().query(
            'SELECT book_id, book_title, isbn, publisher_id, book_format, pages, published, year FROM Books WHERE book_id = ? AND checked_out = TRUE', 
            [book_id]
        );

        if (book.length === 0) {
            return res.status(400).json({ error: 'This book was not borrowed.' });
        }

        await getConnection().query(
            'UPDATE Books SET checked_out = FALSE WHERE book_id = ?', 
            [book_id]
        );

        const returnedBook = book[0];
        res.status(200).json({ 
            message: `Book returned successfully.`,
            bookDetails: returnedBook
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Server Port Configuration and Start
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
