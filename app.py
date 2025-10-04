
import sqlite3
import csv
import os
from flask import Flask, render_template, request, jsonify, send_file, flash, redirect, url_for
from datetime import datetime
import tempfile

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this in production

DATABASE = 'inventory.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize the database with required table"""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
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
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/add_inventory', methods=['POST'])
def add_inventory():
    """Add inventory data to database"""
    try:
        # Get cluster details
        platform = request.form.get('platform')
        app_name = request.form.get('app_name')
        cluster_name = request.form.get('cluster_name')
        environment = request.form.get('environment')
        data_center = request.form.get('data_center')

        # Get hostname details
        hostname_data = request.form.get('hostname_data')

        if not all([platform, app_name, cluster_name, environment, data_center, hostname_data]):
            flash('All fields are required', 'error')
            return redirect(url_for('index'))

        # Parse hostname data
        lines = hostname_data.strip().split('\n')
        conn = get_db_connection()

        for line in lines:
            if line.strip():
                parts = line.strip().split()
                if len(parts) >= 4:
                    hostname = parts[0]
                    ip_address = parts[1]
                    service = parts[2]
                    port = parts[3]

                    conn.execute('''
                        INSERT INTO inventory (platform, app_name, cluster_name, environment, 
                                             data_center, hostname, ip_address, service, port)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (platform, app_name, cluster_name, environment, data_center, 
                          hostname, ip_address, service, port))

        conn.commit()
        conn.close()

        flash('Data added successfully!', 'success')
        return redirect(url_for('index'))

    except Exception as e:
        flash(f'Error adding data: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/export_all')
def export_all():
    """Export all inventory data as CSV"""
    try:
        conn = get_db_connection()
        rows = conn.execute('SELECT * FROM inventory ORDER BY created_date DESC').fetchall()
        conn.close()

        # Create temporary CSV file
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv', newline='')
        writer = csv.writer(temp_file)

        # Write header
        writer.writerow(['ID', 'Platform', 'App Name', 'Cluster Name', 'Environment', 
                        'Data Center', 'Hostname', 'IP Address', 'Service', 'Port', 'Created Date'])

        # Write data
        for row in rows:
            writer.writerow([row[i] for i in range(len(row))])

        temp_file.close()

        return send_file(temp_file.name, as_attachment=True, 
                        download_name=f'inventory_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
                        mimetype='text/csv')

    except Exception as e:
        flash(f'Error exporting data: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/get_filter_options')
def get_filter_options():
    """Get unique values for filter dropdowns"""
    conn = get_db_connection()

    platforms = [row[0] for row in conn.execute('SELECT DISTINCT platform FROM inventory ORDER BY platform').fetchall()]
    app_names = [row[0] for row in conn.execute('SELECT DISTINCT app_name FROM inventory ORDER BY app_name').fetchall()]
    environments = [row[0] for row in conn.execute('SELECT DISTINCT environment FROM inventory ORDER BY environment').fetchall()]
    data_centers = [row[0] for row in conn.execute('SELECT DISTINCT data_center FROM inventory ORDER BY data_center').fetchall()]

    conn.close()

    return jsonify({
        'platforms': platforms,
        'app_names': app_names,
        'environments': environments,
        'data_centers': data_centers
    })

@app.route('/search_inventory', methods=['POST'])
def search_inventory():
    """Search inventory based on filters or search terms"""
    try:
        data = request.get_json()

        conn = get_db_connection()

        if data.get('search_type') == 'filter':
            # Filter-based search
            query = 'SELECT * FROM inventory WHERE 1=1'
            params = []

            if data.get('platform'):
                query += ' AND platform = ?'
                params.append(data['platform'])
            if data.get('app_name'):
                query += ' AND app_name = ?'
                params.append(data['app_name'])
            if data.get('environment'):
                query += ' AND environment = ?'
                params.append(data['environment'])
            if data.get('data_center'):
                query += ' AND data_center = ?'
                params.append(data['data_center'])

            query += ' ORDER BY created_date DESC'

        elif data.get('search_type') == 'text':
            # Text-based search
            search_term = data.get('search_term', '').strip()
            query = '''
                SELECT * FROM inventory 
                WHERE hostname LIKE ? 
                   OR ip_address LIKE ? 
                   OR cluster_name LIKE ?
                ORDER BY created_date DESC
            '''
            params = [f'%{search_term}%', f'%{search_term}%', f'%{search_term}%']

        rows = conn.execute(query, params).fetchall()
        conn.close()

        # Convert to list of dictionaries
        results = []
        for row in rows:
            results.append({
                'id': row['id'],
                'platform': row['platform'],
                'app_name': row['app_name'],
                'cluster_name': row['cluster_name'],
                'environment': row['environment'],
                'data_center': row['data_center'],
                'hostname': row['hostname'],
                'ip_address': row['ip_address'],
                'service': row['service'],
                'port': row['port'],
                'created_date': row['created_date']
            })

        return jsonify({'results': results})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete_selected', methods=['POST'])
def delete_selected():
    """Delete selected inventory items"""
    try:
        data = request.get_json()
        ids_to_delete = data.get('ids', [])

        if not ids_to_delete:
            return jsonify({'error': 'No items selected for deletion'}), 400

        conn = get_db_connection()
        placeholders = ','.join(['?' for _ in ids_to_delete])
        conn.execute(f'DELETE FROM inventory WHERE id IN ({placeholders})', ids_to_delete)
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': f'Deleted {len(ids_to_delete)} items'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/export_selected', methods=['POST'])
def export_selected():
    """Export selected inventory items as CSV"""
    try:
        data = request.get_json()
        ids_to_export = data.get('ids', [])

        if not ids_to_export:
            return jsonify({'error': 'No items selected for export'}), 400

        conn = get_db_connection()
        placeholders = ','.join(['?' for _ in ids_to_export])
        rows = conn.execute(f'SELECT * FROM inventory WHERE id IN ({placeholders}) ORDER BY created_date DESC', 
                          ids_to_export).fetchall()
        conn.close()

        # Create temporary CSV file
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv', newline='')
        writer = csv.writer(temp_file)

        # Write header
        writer.writerow(['ID', 'Platform', 'App Name', 'Cluster Name', 'Environment', 
                        'Data Center', 'Hostname', 'IP Address', 'Service', 'Port', 'Created Date'])

        # Write data
        for row in rows:
            writer.writerow([row[i] for i in range(len(row))])

        temp_file.close()

        return jsonify({'download_url': f'/download_temp/{os.path.basename(temp_file.name)}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_temp/<filename>')
def download_temp(filename):
    """Download temporary file"""
    temp_path = os.path.join(tempfile.gettempdir(), filename)
    if os.path.exists(temp_path):
        return send_file(temp_path, as_attachment=True, 
                        download_name=f'selected_inventory_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
                        mimetype='text/csv')
    return "File not found", 404

if __name__ == '__main__':
    init_database()
    app.run(debug=True, host='0.0.0.0', port=5000)
