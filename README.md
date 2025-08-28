# Boulder City Council Tracker

A comprehensive web application for tracking Boulder, CO City Council members, meetings, agendas, and voting records. Built with modern web technologies and designed for transparency and civic engagement.

## 🚀 Features

- **Council Member Profiles**: Complete information about each council member including bios, contact info, and committee assignments
- **Meeting Tracking**: Comprehensive meeting schedules with agendas, minutes, and video links
- **Vote Transparency**: Detailed voting records for all agenda items
- **Real-time Updates**: Automated data ingestion via Python scrapers
- **Responsive Design**: Mobile-first design built with Tailwind CSS
- **Modern Architecture**: Built with Next.js 14, Supabase, and TypeScript

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

### Backend
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Edge Functions** - Serverless API endpoints
- **Row Level Security** - Secure data access policies

### Data Ingestion
- **Python 3.11** - Web scraping and data processing
- **Playwright** - Dynamic site automation
- **BeautifulSoup** - HTML parsing
- **GitHub Actions** - Automated scraping workflows

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Supabase account
- Vercel account (for deployment)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/boulder-city-council-tracker.git
cd boulder-city-council-tracker
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Python dependencies
cd scraper
pip install -r requirements.txt
cd ..
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema:
   ```bash
   # Copy your Supabase credentials to .env.local
   cp env.example .env.local
   
   # Run the schema setup
   npm run db:setup
   ```

3. Deploy Edge Functions:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Deploy functions
   supabase functions deploy
   ```

### 4. Configure Environment Variables

Create `.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Set Up GitHub Actions

1. Add repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. The scraper will run automatically every day at 2 AM UTC

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 📊 Database Schema

The application uses the following main tables:

- **members**: Council member information and profiles
- **meetings**: Meeting schedules and metadata
- **agenda_items**: Individual agenda items for each meeting
- **votes**: Voting records for each agenda item
- **quotes**: Notable quotes from council members

## 🔄 Data Ingestion

### Automated Scraping

The Python scraper runs via GitHub Actions and:

1. Scrapes council member information from [bouldercolorado.gov](https://bouldercolorado.gov)
2. Extracts meeting agendas and minutes
3. Processes voting records
4. Updates the database automatically

### Manual Scraping

```bash
cd scraper
python scrape_members.py
python scrape_agendas.py
python scrape_votes.py
```

## 🎨 Customization

### Styling

- Modify `tailwind.config.js` for color schemes and design tokens
- Update `components/ui/` for reusable component styles
- Customize `app/globals.css` for global styles

### Data Sources

- Update URLs in scraper files for different municipalities
- Modify database schema for additional data fields
- Extend Edge Functions for new API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This application is not affiliated with the City of Boulder or Boulder City Council. It is an independent project created for civic transparency and engagement.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/boulder-city-council-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/boulder-city-council-tracker/discussions)
- **Email**: your-email@example.com

## 🔮 Roadmap

- [ ] Real-time notifications for new meetings
- [ ] Advanced analytics and voting patterns
- [ ] Mobile app (React Native)
- [ ] API documentation
- [ ] Integration with other municipal data sources
- [ ] Public comment tracking
- [ ] Email newsletter subscriptions

---

Built with ❤️ for Boulder, Colorado
