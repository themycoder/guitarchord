import React from "react";
import { FaFacebook, FaYoutube, FaEnvelope, FaGuitar } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 text-sm pt-12 pb-6 mt-12 transition-colors duration-300 border-t border-gray-300 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo & intro */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaGuitar className="text-blue-600 dark:text-blue-400 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              guitarhiho
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Guitar theory tools and resources for musicians and learners.
            Explore chords, scales, and progressions to level up your skills.
          </p>
        </div>

        {/* Tools */}
        <div>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-3 uppercase tracking-wide">
            Tools
          </h3>
          <ul className="space-y-2">
            {[
              "Chord Analyzer",
              "Chord Progressions",
              "Guitar Chord Finder",
              "Chord Trainer",
            ].map((tool, i) => (
              <li key={i}>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {tool}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-3 uppercase tracking-wide">
            Resources
          </h3>
          <ul className="space-y-2">
            {["Music Theory", "Blog", "Contact", "Privacy Policy"].map(
              (item, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Social / Contact */}
        <div>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-3 uppercase tracking-wide">
            Connect
          </h3>
          <ul className="space-y-3">
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FaFacebook /> Facebook
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <FaYoutube /> YouTube
              </a>
            </li>
            <li>
              <a
                href="mailto:support@oolimo.com"
                className="flex items-center gap-2 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
              >
                <FaEnvelope /> Email Support
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom line */}
      <div className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Guitarhiho. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
