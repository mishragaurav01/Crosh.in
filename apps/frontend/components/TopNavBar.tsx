export default function Header(){
    return(
        <header className="w-full top-0 sticky z-50 bg-background transition-all ease-in-out duration-300">
            <div className="flex justify-between items-center w-full px-xxl py-lg max-w-[1280px] mx-auto">
                <a className="font-playfair text-headline-md text-primary tracking-tight" href="/">Crosh.in</a>
                <nav className="hidden md:flex gap-xl items-center">
                    <NavItem label="Shop"/>
                    <NavItem label="New Arivals"/>
                    <NavItem label="Materials"/>
                    <NavItem label="Our Story"/>
                </nav>
                <div className="flex items-center gap-lg">
                    <NavButton label="favorite"/>
                    <NavButton label="shopping_bag"/>
                </div>
            </div>
        </header>
    )
}

function NavItem({label}: {label:string}){
    return(
        <a className="font-headline-sm text-headline-sm text-on-secondary-fixed-variant hover:text-primary transition-colors duration-300" href="#">{label}</a>
    )
}

function NavButton({label}: {label:string}){
    return(
        <button className="material-symbols-outlined text-primary hover:opacity-70 transition-opacity">{label}</button>
    )
}