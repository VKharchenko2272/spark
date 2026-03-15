import React from 'react';
import './footer-style.css';

function Footer() {
    return (
        <footer className="footer text-light py-5">
            <div className="container py-4 mb-4gi">
                <div className="row">
                    <div className="col-md-3">
                        <h5 className='fw-bold'>Contact Information</h5>
                        <ul className="list-unstyled">
                            <li>
                                <a href="/Support-Contact" className="text-light" aria-label="Quick Links: Support Contact">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="/HR-Contact" className="text-light" aria-label="Quick Links: HR Contact">
                                    HR Contact
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-3">
                        <h5 className='fw-bold'>Legal Information</h5>
                        <ul className="list-unstyled">
                            <li>
                                <a href="/Privacy-Policy" className="text-light" aria-label="Quick Links: Privacy Policy">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="/Terms-of-Service" className="text-light" aria-label="Quick Links: Terms of Service">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="/Disclaimer" className="text-light" aria-label="Quick Links: Disclaimer">
                                    Disclaimer
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-3">
                        <h5 className='fw-bold'>Company Information</h5>
                        <ul className="list-unstyled">
                            <li>
                                <a href="/Company-Name" className="text-light" aria-label="Quick Links: Company Name">
                                    Company Name
                                </a>
                            </li>
                            <li>
                                <a href="/Address" className="text-light" aria-label="Quick Links: Address">
                                    Address
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-3">
                        <h5 className='fw-bold'>Accessibility and Help</h5>
                        <ul className="list-unstyled">
                            <li>
                                <a href="/Help-Center-Link" className="text-light" aria-label="Quick Links: Help Center Link">
                                    Help Center Link
                                </a>
                            </li>
                            <li>
                                <a href="/Accessibility-Features" className="text-light" aria-label="Quick Links: Accessibility Features">
                                    Accessibility Features
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="row mt-4">
                    <div className="col-md-3">
                        <h5 className='fw-bold'>Copyright Notice</h5>
                        <ul className="list-unstyled">
                            <li>
                                <a href="/Copyright-Statement" className="text-light" aria-label="Quick Links: Copyright Statement">
                                    Copyright Statement
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-3">
                        <h5 className='fw-bold'>Application Version</h5>
                        <ul className="list-unstyled">
                            <li>
                                <a href="/Link-to-phone-app" className="text-light" aria-label="Quick Links: Link to phone app">
                                    Link to Phone App
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-3 d-flex flex-column align-items-center">
                        <h5 className='fw-bold'>Follow Us</h5>
                        <ul className="list-unstyled d-flex m-0" style={{gap: "0.5rem"}}>
                            <li>
                                <span className='social-icon facebook-icon'></span>
                            </li>
                            <li>
                                <span className='social-icon youtube-icon'></span>
                            </li>
                            <li>
                                <span className='social-icon linkedin-icon text-danger'></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className='border-top pt-3'>
                <ul className='list-unstyled d-flex justify-content-center' style={{gap: '1rem'}}> 
                    <li className='fw-bold'>Legal and Privacy </li>
                    <li className='fw-bold'> Non-Discrimination Notice</li>
                    <li className='fw-bold'> Language Assistance</li>
                    <li className='fw-bold'>Interoperability</li>
                    <li className='fw-bold'>Transparency in Coverage</li>
                </ul>
            </div>
        </footer>
    );
}

export default Footer;
