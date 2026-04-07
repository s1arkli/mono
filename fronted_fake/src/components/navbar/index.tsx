import { Link } from "react-router-dom"

export default function Navbar() {
    return (
        <nav className="bg-neutral-primary fixed w-full z-20 top-0 start-0 border-b border-default">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src="https://flowbite.com/docs/images/logo.svg" className="h-7" alt="Flowbite Logo" />
                    <span className="self-center text-xl text-heading font-semibold whitespace-nowrap">Flowbite</span>
                </Link>
                <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                    <button
                        type="button"
                        className="flex text-sm bg-neutral-primary rounded-full md:me-0 focus:ring-4 focus:ring-neutral-tertiary"
                        id="user-menu-button"
                        aria-expanded="false"
                    >
                        <span className="sr-only">Open user menu</span>
                        <img className="w-8 h-8 rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="user photo" />
                    </button>
                    {/* Dropdown menu */}
                    <div className="z-50 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-44" id="user-dropdown">
                        <div className="px-4 py-3 text-sm border-b border-default">
                            <span className="block text-heading font-medium">Joseph McFall</span>
                            <span className="block text-body truncate">name@flowbite.com</span>
                        </div>
                        <ul className="p-2 text-sm text-body font-medium" aria-labelledby="user-menu-button">
                            <li>
                                <Link to="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Dashboard</Link>
                            </li>
                            <li>
                                <Link to="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Settings</Link>
                            </li>
                            <li>
                                <Link to="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Earnings</Link>
                            </li>
                            <li>
                                <Link to="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Sign out</Link>
                            </li>
                        </ul>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-base md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary"
                        aria-controls="navbar-user"
                        aria-expanded="false"
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" />
                        </svg>
                    </button>
                </div>
                <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-user">
                    <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-default rounded-base bg-neutral-secondary-soft md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-neutral-primary">
                        <li>
                            <Link to="/" className="block py-2 px-3 text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0" aria-current="page">Home</Link>
                        </li>
                        <li>
                            <Link to="/about" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">About</Link>
                        </li>
                        <li>
                            <Link to="/services" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Services</Link>
                        </li>
                        <li>
                            <Link to="/pricing" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Pricing</Link>
                        </li>
                        <li>
                            <Link to="/contact" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Contact</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}