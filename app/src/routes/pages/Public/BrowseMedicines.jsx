
import { useQuery } from "@tanstack/react-query";
import MedicineCard from "../../../components/Cards/MedicineCard.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { fetchMedicines } from "../../../lib/queries.js";
import "./Public.css";

export default function BrowseMedicines() {
  const { readonlyContract } = useWeb3();

  const medicinesQuery = useQuery({
    queryKey: ["public", "medicines"],
    enabled: !!readonlyContract,
    queryFn: () => fetchMedicines(readonlyContract, { includeInactive: true })
  });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Medicines</h2>
          <p>Catalog of medicines available via the HealthcareLite network.</p>
        </div>
      </header>

      <div className="card-grid">
        {medicinesQuery.isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="panel skeleton-card" />
          ))}
        {!medicinesQuery.isLoading && (medicinesQuery.data || []).length === 0 && (
          <div className="panel">
            <p>No medicines published yet.</p>
          </div>
        )}
        {(medicinesQuery.data || []).map((medicine) => (
          <MedicineCard key={medicine.id} medicine={medicine} />
        ))}
      </div>
    </section>
  );
}
