import React from "react";
import "../styles/footer.css"
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                
                {/* Brand Section */}
                <div className="footer-brand">
                    <h2>ShopSync</h2>
                    <p>One Stop for Your necessity</p>
                </div>

                {/* Quick Links */}
                <div className="footer-links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="#">Home</a></li>
                        <li><a href="#">Cart</a></li>
                        <li><a href="#">About</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>

                <div className="footer-links">
                    <h3> Logins and Registrations </h3>
                    <ul>
                        <li><a href="/employee_login">Employee</a></li>
                    </ul>
                </div>


                {/* Contact Info */}
                <div className="footer-contact">
                    <h3>Contact Us</h3>
                    <p>Email: Email</p>
                    <p>Phone: 999999999</p>
                    <p>Location: Location</p>
                </div>
            </div>

            {/* Social Media */}
            <div className="footer-social">
                <p>Follow us on</p>
                <div className="social-icons">
                    <a href="#"><FacebookIcon /></a>
                    <a href="#"><TwitterIcon /></a>
                    <a href="#"><InstagramIcon /></a>
                    <a href="#"><LinkedInIcon /></a>
                </div>
            </div>
        </footer>
    );
}
