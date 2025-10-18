import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ExamSchedules from "./pages/ExamSchedules";
import Courses from "./pages/Courses";
import Subjects from "./pages/Subjects";
import Rooms from "./pages/Rooms";
import Invigilators from "./pages/Invigilators";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/exams" element={<ExamSchedules />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/invigilators" element={<Invigilators />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
