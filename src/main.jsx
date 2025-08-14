import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Gallery from './Pages/Gallery.jsx'
import GalleryHome from './Pages/GalleryHome.jsx'
import GalleryResult from './Pages/GalleryResult.jsx'
import ProtectedRoute from './Pages/ProtectedRoute.jsx'
import LoginPage from './Pages/LoginPage.jsx'
import GalleryFilter from './Pages/GalleryFilter.jsx'

import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/media/:shortUUID",
        element: <App />
    },
    {
        path: "/admin",
        element: (<ProtectedRoute>
            <Gallery />
        </ProtectedRoute>)
    },
    {
        path: '/gallery/home',
        element: (<ProtectedRoute>
            <GalleryHome />
        </ProtectedRoute>)
    },
    {
        path: '/gallery/result',
        element: (
            <ProtectedRoute>
                <GalleryResult />
            </ProtectedRoute>)
    },
    {
        path: "/login",
        element: <LoginPage />
    },
    {
        path: "/gallery/filter",
        element: (
            <ProtectedRoute>
                <GalleryFilter />
            </ProtectedRoute>
        )}
]);

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
