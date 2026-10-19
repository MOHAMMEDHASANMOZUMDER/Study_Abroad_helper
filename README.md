# 🎓 CUET Study Abroad Helper

A web-based platform designed to help students explore study-abroad opportunities and make their international education journey more organized.

🌐 **Live Demo:** [cuetabroadstudy.vercel.app](https://cuetabroadstudy.vercel.app)

📂 **GitHub Repository:** [Study_Abroad_helper](https://github.com/MOHAMMEDHASANMOZUMDER/Study_Abroad_helper)

---
## 📸 Screenshots
<img width="1920" height="1610" alt="screencapture-cuetabroadstudy-vercel-app-2026-10-19-22_45_21" src="https://github.com/user-attachments/assets/6d5fb507-813e-4a83-b7fd-424e75fceaa2" />
<img width="1920" height="1277" alt="screencapture-cuetabroadstudy-vercel-app-professors-2026-10-19-22_39_16" src="https://github.com/user-attachments/assets/864a139d-22c5-4ec4-b77e-b70cba07bd95" />
<img width="1920" height="737" alt="image" src="https://github.com/user-attachments/assets/1b3e5818-4f4b-46c8-b726-4a069198b5f6" />
<img width="1920" height="1541" alt="image" src="https://github.com/user-attachments/assets/3cac9a35-6f22-4733-b31e-a63fce332a3c" />





## 📖 About the Project

**CUET Study Abroad Helper** is a web application developed to support students interested in pursuing higher education abroad. It aims to provide a convenient starting point for exploring international study opportunities through a modern web interface.

The project is built with React and TypeScript, powered by Vite, and includes a Node.js/Express backend with PostgreSQL support.

## ✨ Key Highlights

- 🎓 **Study Abroad Support:** A platform focused on international higher education.
- ⚛️ **Modern Frontend:** Built with React and TypeScript.
- 🚀 **Fast Development:** Powered by Vite.
- 🔧 **Backend Integration:** Node.js and Express for server-side functionality.
- 🗄️ **Database Support:** PostgreSQL integration.
- 🔐 **Authentication Infrastructure:** Includes libraries for password hashing and JWT-based authentication.
- 🌐 **Web Deployment:** A live deployment is available on Vercel.

> Note: The exact features available to users depend on the current application implementation.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe development |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling |
| Node.js | Backend runtime |
| Express.js | API and server-side functionality |
| PostgreSQL | Database |
| JSON Web Token (JWT) | Authentication infrastructure |
| bcryptjs | Password hashing |
| React Router | Client-side routing |
| Vercel | Deployment |

## 📂 Project Structure

```text
Study_Abroad_helper/
├── api/                 # API and deployment-related code
├── public/              # Static assets
├── server/              # Backend server
├── src/                 # Frontend application
├── index.html           # HTML entry point
├── neon.ts              # Neon-related configuration
├── package.json         # Dependencies and scripts
├── package-lock.json    # Dependency lockfile
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── vercel.json          # Vercel deployment configuration
└── README.md            # Project documentation
```

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) — a compatible version for the project's dependencies
- npm — included with Node.js
- Access to a PostgreSQL database if required by the backend configuration
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/MOHAMMEDHASANMOZUMDER/Study_Abroad_helper.git
```

### 2. Navigate to the Project Directory

```bash
cd Study_Abroad_helper
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root if required by your local configuration.

```env
# Add the environment variables required by your application.
# Configure your database connection and authentication secrets
# according to the server implementation.
```

Use the existing server configuration to determine the exact variable names. Never commit database credentials, JWT secrets, or other sensitive values to Git.

### 5. Start the Development Server

To start the frontend:

```bash
npm run dev
```

To start the backend API:

```bash
npm run api
```

To run the frontend and backend concurrently:

```bash
npm run dev:full
```

Once the development server starts, open the local URL printed in your terminal, typically `http://localhost:5173`.

### 6. Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### 7. Run Lint Checks

```bash
npm run lint
```

## ⚙️ Configuration

Before running the complete application, verify the following:

- Database connection settings are configured correctly.
- Required environment variables are available.
- Authentication secrets are configured securely if authentication is enabled.
- Backend API routes and frontend API requests use the appropriate local or production configuration.
- Deployment environment variables are configured in Vercel when required.

Refer to the source code in `server/`, `api/`, and `src/` for implementation-specific details.

## 🌍 Deployment

The project is associated with a Vercel deployment.

To deploy your own instance:

1. Fork or clone this repository.
2. Import the repository into [Vercel](https://vercel.com/).
3. Configure the necessary environment variables.
4. Ensure database connectivity and backend routing are configured for production.
5. Deploy the application and verify that the frontend and API work correctly.

Deployment settings may need to be adjusted depending on the application's serverless API configuration.

## 🔮 Future Improvements

Potential enhancements for the platform include:

- 📚 University and program discovery.
- 🌎 Country-specific study-abroad information.
- 💰 Tuition fees, living costs, and scholarship information.
- 📋 Admission requirements and application checklists.
- 📅 Application deadlines and important dates.
- 👤 Personalized student profiles and saved opportunities.
- 📊 University comparison tools.
- 📱 Improved mobile responsiveness.
- 🔔 Application reminders and notifications.

These are possible future enhancements, not a claim that every feature is currently implemented.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add: your feature description"
   ```

4. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request describing your changes.

## 🔒 Security

- Never commit `.env` files or private credentials.
- Use strong secrets for authentication.
- Validate and sanitize user input on the server.
- Keep project dependencies up to date.
- Configure database permissions appropriately.

## 📄 License

No license has been specified here. If you intend to make this project open source, add a `LICENSE` file and update this section with your chosen license.

## 👨‍💻 Author

**Mohammed Hasan Mozumder**

- GitHub: [@MOHAMMEDHASANMOZUMDER](https://github.com/MOHAMMEDHASANMOZUMDER)
- Project: [CUET Study Abroad Helper](https://github.com/MOHAMMEDHASANMOZUMDER/Study_Abroad_helper)

---

⭐ If you find this project useful, consider giving the repository a star!

*Built to support students exploring opportunities for higher education abroad.*
