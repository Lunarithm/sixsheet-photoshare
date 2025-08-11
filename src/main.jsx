import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Gallery from './Pages/Gallery.jsx'
import GalleryHome from './Pages/GalleryHome.jsx'
import GalleryResult from './Pages/GalleryResult.jsx'

import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/media/:shortUUID",
        element: <App/>
    },
    {
        path: "/admin",
        element: <Gallery/>
    },
    {
        path:'/gallery/home',
        element: <GalleryHome/>
    },
    {
        path:'/gallery/result',
        element: <GalleryResult/>
    },
    
]);

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
