
# Deploying GoSimpleLiving to a VPS (Ubuntu/Debian)

Since this is a React Single Page Application (SPA), you don't need to run a Node.js process (like `pm2`) to keep it alive. You simply need to build the static files and serve them with a web server like Nginx.

## Prerequisites

1.  A VPS (Virtual Private Server) running **Ubuntu 20.04** or **22.04**.
2.  **Root access** (SSH) to the server.
3.  A domain name pointing to your server's IP address.

---

## Step 1: Prepare the Build Locally

On your local computer (where you have the code):

1.  Ensure your `.env` file has your production keys:
    ```env
    VITE_API_KEY=your_google_gemini_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    ```

2.  Run the build command:
    ```bash
    npm run build
    ```

3.  This creates a **`dist`** folder. This folder contains everything your website needs.

---

## Step 2: Configure the VPS

SSH into your server:
```bash
ssh root@your_server_ip
```

### 1. Update and Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Create Directory for your Site
```bash
sudo mkdir -p /var/www/gosimpleliving
```

### 3. Upload Your Files
You need to move the contents of your local `dist` folder to the server's `/var/www/gosimpleliving` folder.

**Option A: Using SCP (Command Line from Local Machine)**
Run this from your local project folder:
```bash
scp -r dist/* root@your_server_ip:/var/www/gosimpleliving
```

**Option B: Using FileZilla**
1. Connect to your server using SFTP.
2. Drag files from local `dist` folder to `/var/www/gosimpleliving`.

### 4. Set Permissions
Back on your server (SSH):
```bash
sudo chown -R www-data:www-data /var/www/gosimpleliving
sudo chmod -R 755 /var/www/gosimpleliving
```

---

## Step 3: Configure Nginx

1.  Create a new configuration file:
    ```bash
    sudo nano /etc/nginx/sites-available/gosimpleliving
    ```

2.  Paste the following configuration (Replace `yourdomain.com` with your actual domain):

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        root /var/www/gosimpleliving;
        index index.html;

        location / {
            # This is CRITICAL for React SPAs.
            # If a file isn't found, it serves index.html so React can handle the route.
            try_files $uri $uri/ /index.html;
        }

        # Optional: Cache static assets for better performance
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
    }
    ```

3.  Save and exit (Press `Ctrl+X`, then `Y`, then `Enter`).

4.  Enable the site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/gosimpleliving /etc/nginx/sites-enabled/
    ```

5.  Test configuration and restart Nginx:
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## Step 4: Setup SSL (HTTPS)

Secure your site for free using Certbot (Let's Encrypt).

1.  Install Certbot:
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

2.  Run Certbot:
    ```bash
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
    ```

3.  Follow the prompts. Certbot will automatically update your Nginx config to use HTTPS.

---

## Troubleshooting

**The site shows a blank white page:**
Check the browser console (F12). If you see 404 errors for `.js` files, check your Nginx permissions or ensure the `dist` folder contents were uploaded correctly (not `dist` inside `dist`).

**Refresh gives 404 Error:**
Ensure the `try_files $uri $uri/ /index.html;` line exists in your Nginx config. This tells the server to load the React app for any unknown URL path.
