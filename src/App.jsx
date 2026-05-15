import { useState } from "react";
import { Header } from "./components/Header";
import { Search } from "./components/Search";
import { createHeaderStatus } from "./utils/headerStatus";

function App() {
  const [headerStatus, setHeaderStatus] = useState(() => createHeaderStatus());

  return (
    <div className="min-h-dvh flex flex-col justify-center gap-1 px-4 py-6">
      <Header status={headerStatus} />
      <Search onStatusChange={setHeaderStatus} />
    </div>
  );
}

export default App;
