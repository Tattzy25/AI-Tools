import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Image, 
  Table, 
  GitBranch,
  Menu,
  X,
  Sparkles 
} from 'lucide-react';
import { Button } from './ui/button';
import ThemeSelect from './ThemeSelect';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from './ui/navigation-menu';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Image Extraction', href: '/image-extraction', icon: Image },
    { name: 'Data Generator', href: '/data-generator', icon: Table },
    { name: 'API Mapper', href: '/api-mapper', icon: GitBranch },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">AI Power Tools</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavigationMenuItem key={item.name}>
                      <NavigationMenuLink asChild className={
                        isActive(item.href)
                          ? 'bg-accent text-accent-foreground px-3 py-2 rounded-md'
                          : 'px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground'
                      }>
                        <Link to={item.href}>
                          <span className="inline-flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
            <ThemeSelect />
          </div>

          <div className="md:hidden">
            <Button variant="outline" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={
                    isActive(item.href)
                      ? 'flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-accent-foreground'
                      : 'flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground'
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-2">
              <ThemeSelect />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;