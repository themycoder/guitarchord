import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import AddChord from "./pages/AddChord";
import AddScale from "./pages/AddScale";
import ListTunings from "./pages/Tunings/ListTunings";
import CreateTuning from "./pages/Tunings/CreateTuning";
import EditTuning from "./pages/Tunings/EditTuning";
import ListGuitarNotes from "./pages/GuitarNotes/ListGuitarNotes";
import CreateGuitarNote from "./pages/GuitarNotes/CreateGuitarNote";
import EditGuitarNote from "./pages/GuitarNotes/EditGuitarNote";
import Theory from "./pages/Theory";

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="add-chord" element={<AddChord />} />
        <Route path="add-scale" element={<AddScale />} />
        <Route path="/admin/tunings" element={<ListTunings />} />
        <Route path="/admin/tunings/create" element={<CreateTuning />} />
        <Route path="/admin/tunings/edit/:id" element={<EditTuning />} />
        <Route path="/admin/guitar-notes" element={<ListGuitarNotes />} />
        <Route
          path="/admin/guitar-notes/create"
          element={<CreateGuitarNote />}
        />
        <Route
          path="/admin/guitar-notes/edit/:id"
          element={<EditGuitarNote />}
        />
        <Route path="/admin/add-theory" element={<Theory />} />
      </Route>
    </Routes>
  );
}

export default App;
