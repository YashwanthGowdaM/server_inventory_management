
# Inventory Management System

A Flask-based web application for managing server inventory with dynamic search, filtering, and export capabilities.

## Features

- **Cluster Details Management**: Add platform, app name, cluster name, environment, and data center information
- **Hostname Management**: Bulk add hostname, IP address, service, and port details
- **Dynamic Search**: Search by hostname, IP address, or cluster name
- **Advanced Filtering**: Filter by platform, app name, environment, and data center
- **Export Functionality**: Export all data or selected items as CSV
- **Delete Functionality**: Delete selected inventory items
- **Responsive Design**: Mobile-friendly interface with Bootstrap 5

## Installation

1. Clone or download the project files
2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Run the Flask application:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Project Structure

```
inventory-management/
├── app.py              # Main Flask application
├── inventory.db        # SQLite database (auto-created)
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── templates/
│   └── index.html     # Main HTML template
└── static/
    ├── css/
    │   └── style.css  # Custom CSS styles
    └── js/
        └── script.js  # JavaScript functionality
```

## Sections Overview

### Section 1: Cluster Details
- Platform selection (GemFire, Kafka)
- App name input
- Cluster name input
- Environment selection (dev, qa, stg, uat, lab, poc, prod)
- Data center selection (dal, phx, ua, us)

### Section 2: Hostname Details
- Bulk input for hostname data in format:
  ```
  hostname ip_address service port
  ```

### Section 3: Actions
- **Add to INV**: Save data to database
- **Export All**: Download all inventory as CSV
- **Export Selected**: Download selected items as CSV
- **Delete Selected**: Remove selected items from database

### Section 4: Search & Filter
- Filter by dropdowns (populated from existing data)
- Text search by hostname, IP, or cluster name

### Section 5: Results
- Tabular display of inventory data
- Checkbox selection for bulk operations
- Responsive scrollable table

## Database Schema

The application uses SQLite with the following table structure:

```sql
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    app_name TEXT NOT NULL,
    cluster_name TEXT NOT NULL,
    environment TEXT NOT NULL,
    data_center TEXT NOT NULL,
    hostname TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    service TEXT NOT NULL,
    port TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Features in Detail

- **Confirmation Dialogs**: All destructive actions require user confirmation
- **Real-time Search**: Search as you type functionality
- **Bulk Operations**: Select multiple items for export or deletion
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Auto-refresh**: Filter options update automatically when new data is added

## Customization

- Modify dropdown options in `app.py`
- Customize styling in `static/css/style.css`
- Add new features by extending the Flask routes in `app.py`
- Modify the database schema by updating the `init_database()` function

## Security Notes

- Change the secret key in `app.py` for production use
- Consider adding user authentication for production deployment
- Validate and sanitize all user inputs
- Use environment variables for sensitive configuration

## Troubleshooting

- Ensure all required dependencies are installed
- Check that port 5000 is available
- Verify database permissions if using a different database location
- Check browser console for JavaScript errors
