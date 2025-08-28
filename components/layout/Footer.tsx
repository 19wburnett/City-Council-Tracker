export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-boulder-600 to-primary-600 rounded-lg"></div>
              <span className="text-xl font-bold">Boulder City Council Tracker</span>
            </div>
            <p className="text-gray-300 max-w-md">
              Stay informed about your local government. Track council members, 
              meeting agendas, and voting records in real-time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/members" className="text-gray-300 hover:text-white transition-colors">
                  Council Members
                </a>
              </li>
              <li>
                <a href="/meetings" className="text-gray-300 hover:text-white transition-colors">
                  Meetings
                </a>
              </li>
              <li>
                <a href="/votes" className="text-gray-300 hover:text-white transition-colors">
                  Voting Records
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://bouldercolorado.gov/city-council" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Official Website
                </a>
              </li>
              <li>
                <a 
                  href="https://bouldercolorado.gov/meetings" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Meeting Calendar
                </a>
              </li>
              <li>
                <a 
                  href="https://bouldercolorado.gov/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact Info
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Boulder City Council Tracker. 
            Not affiliated with the City of Boulder.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </a>
            <a href="https://github.com/your-repo" className="text-gray-400 hover:text-white text-sm transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
