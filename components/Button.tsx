import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    children: ReactNode;
}

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
    const baseStyles = "px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center";

    const variants = {
        primary: "bg-primary text-white hover:bg-blue-600",
        secondary: "bg-gray-800 text-white hover:bg-gray-700",
        danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        ghost: "bg-transparent text-gray-400 hover:text-white",
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
