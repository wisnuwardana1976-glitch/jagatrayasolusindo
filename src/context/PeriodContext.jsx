import { createContext, useState, useContext, useEffect } from 'react';

const PeriodContext = createContext();

export const PeriodProvider = ({ children }) => {
    // Initialize from localStorage or null
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        const saved = localStorage.getItem('selected_period');
        return saved ? JSON.parse(saved) : null;
    });

    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPeriods();
    }, []);

    // Effect to persist selection
    useEffect(() => {
        if (selectedPeriod) {
            localStorage.setItem('selected_period', JSON.stringify(selectedPeriod));
        } else {
            localStorage.removeItem('selected_period');
        }
    }, [selectedPeriod]);

    const fetchPeriods = async () => {
        try {
            const response = await fetch('/api/accounting-periods');
            const data = await response.json();
            if (data.success) {
                setPeriods(data.data);

                // If no period selected, try to select the current active one
                if (!selectedPeriod && data.data.length > 0) {
                    const active = data.data.find(p => p.status === 'Open');
                    if (active) {
                        setSelectedPeriod(active);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PeriodContext.Provider value={{ selectedPeriod, setSelectedPeriod, periods, loading, fetchPeriods }}>
            {children}
        </PeriodContext.Provider>
    );
};

export const usePeriod = () => useContext(PeriodContext);
