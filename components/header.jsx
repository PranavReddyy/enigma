'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

const menuItems = [
    { name: 'About Us', href: '#about' },
    { name: 'What We Do', href: '#services' },
    // { name: 'Meet the Team', href: '#team' },
    { name: 'Events', href: '/events' },
    { name: 'FAQ', href: '#faq' },
]

const menuVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } },
};

const navLinkVariants = {
    initial: { y: "30vh", transition: { duration: 0.5, ease: [0.37, 0, 0.63, 1] } },
    open: { y: 0, transition: { duration: 0.7, ease: [0, 0.55, 0.45, 1] } },
};

const Logo = () => (
    <div className="flex items-center space-x-3">
        <Image src="/whitelogo.png" alt="Enigma Logo" width={32} height={32} className="w-8 h-8"/>
        <span className="text-xl font-bold text-white">Enigma</span>
    </div>
)

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const router = useRouter()
    const pathname = usePathname()

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll);
    }, [])

    React.useEffect(() => {
    let scrollY = 0;
    
    if (menuState) {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
    } else {
        const storedScrollY = parseInt(document.body.style.top || '0') * -1;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        
        if (pathname === '/' && storedScrollY > 0) {
            window.scrollTo(0, storedScrollY);
        }
    }
}, [menuState, pathname]);

    const handleNavClick = (e, href) => {
    const currentScrollY = window.scrollY;
    setMenuState(false);
    
    if (href.startsWith('#')) {
        e.preventDefault();
        
        if (pathname === '/') {
            setTimeout(() => {
                const element = document.querySelector(href);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300); 
        } else {
            router.push('/' + href);
        }
    } else {
        router.push(href);
    }
};

    return (
        <header className="relative">
            <nav className="fixed z-50 w-full transform-gpu">
                <div className={cn('mt-4 max-w-7xl px-6 transition-all duration-300 lg:px-8 mx-4 lg:mx-auto', isScrolled && 'bg-black/60 max-w-5xl rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl')} style={{ outline: 'none', border: isScrolled ? 'none' : 'none' }}>
                    <div className="relative flex items-center justify-between py-4 lg:py-5">
                        <Link href="/" aria-label="home" className="flex items-center space-x-2 z-10 focus:outline-none">
                            <Logo />
                        </Link>

                        <div className="hidden lg:flex items-center gap-8">
                           <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link href={item.href} onClick={(e) => handleNavClick(e, item.href)} className="text-gray-300 hover:text-white transition-colors duration-200 font-medium focus:outline-none">{item.name}</Link>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/hacktober"
                                className="relative text-sm font-medium text-orange-400 hover:text-orange-300 transition-all duration-200 overflow-hidden group hover:scale-105"
                            >                                
                                <div className="absolute inset-0 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative z-10 drop-shadow-sm">Hacktober</span>
                            </Link>
                        </div>

                        <div className="hidden lg:flex z-10">
                            <Button asChild variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:text-black hover:bg-white hover:border-white/30 transition-all duration-200 backdrop-blur-sm focus:outline-none">
                                <Link href="https://github.com/MU-Enigma" target="_blank" rel="noopener noreferrer">
                                    <Github className="w-4 h-4 mr-2" />
                                    GitHub
                                </Link>
                            </Button>
                        </div>
                        
                        <div className="lg:hidden">
                            {!menuState && (
                                <button onClick={() => setMenuState(true)} aria-label="Open Menu" className="relative z-50 p-2 flex-shrink-0">
                                    <Menu size={28} className="text-white" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {menuState && (
                    <motion.div
                        variants={menuVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-lg"
                    >
                        <button
                            onClick={() => setMenuState(false)}
                            aria-label="Close Menu"
                            className="absolute top-8 right-10 p-2 text-white z-[1000]"
                        >
                            <X size={28} />
                        </button>
                        
                        <div className="flex flex-col items-center justify-center h-full">
                            <ul className="space-y-8 text-center">
                                {menuItems.map((item, index) => (
    <li key={index} className="overflow-hidden">
        <motion.div variants={navLinkVariants} initial="initial" animate="open">
            <Link
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-4xl font-medium text-gray-300 transition-colors hover:text-white"
            >
                {item.name}
            </Link>
        </motion.div>
    </li>
))}
<li className="overflow-hidden">
    <motion.div variants={navLinkVariants} initial="initial" animate="open">
        <Link
            href="/hacktober"
            onClick={(e) => {
                setMenuState(false);
                router.push('/hacktober');
            }}
            className="relative text-4xl font-medium text-orange-400 hover:text-orange-300 transition-all duration-200 overflow-hidden group hover:scale-105"
        >                                            
            <div className="absolute inset-0 rounded blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 drop-shadow-sm">Hacktober</span>
        </Link>
    </motion.div>
</li>
                            </ul>
                            <div className="mt-16">
                                <Button asChild variant="outline" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm">
                                    <Link href="https://github.com/MU-Enigma" target="_blank" rel="noopener noreferrer" className="px-6 py-3">
                                        <Github className="w-5 h-5 mr-3" />
                                        GitHub
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}