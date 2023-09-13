import { Link } from "react-router-dom";
import Button from "./Button";
import { ReactNode } from "react";

type Props = {
   className?: string
   icon: ReactNode;
   label: string;
   to: string;
   arrowIcon?: ReactNode;
};

export default function LinkItem({
   className,
   icon,
   label,
   to,
   arrowIcon,
}: Props) {

   return (
      <Link
         className={"w-full flex flex-row justify-between items-center " + className}
         to={to}
      >
         <Button className="">
            {icon}
            <span className="text-lg font-medium">
               {label}
            </span>
         </Button>

         {arrowIcon && <span>{arrowIcon}</span>}
      </Link>
   );
}
