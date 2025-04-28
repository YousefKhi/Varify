import {Metadata} from "next"
import React from "react";
export const metadata: Metadata = {
    title: 'Projects',
    description: 'Everything that made it out of my head'
}
const Layout = ({
    children,
                }: {
    children: React.ReactNode}) => {
    return (
        <div className="flex gap-2 flex-col-reverse justify-end">
            <div className=" flex-1">{children}</div>
        </div>
    )
}
export default Layout