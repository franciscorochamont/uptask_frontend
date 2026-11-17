import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import DashboardView from "./views/DashboardView";


export default function router() {
  
    return (
        <BrowserRouter>
            <Routes>
                {/* Layout de la App */}
                <Route element={<AppLayout />}> 
                    {/* Pagina Principal */}
                    <Route path="/" element={ <DashboardView />} index/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}


