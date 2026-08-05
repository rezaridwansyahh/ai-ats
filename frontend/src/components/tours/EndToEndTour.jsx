import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';
import { END_TO_END_FLOW } from './endToEndFlow';

const STORAGE_KEY = 'myralix.tour.seen.end-to-end';
const SETTLE_DELAY = 1200;

const EndToEndTourContext = createContext(null);

export function useEndToEndTour(){
    const ctx = useContext(EndToEndTourContext);
    if (!ctx){
        throw new Error('useEndToEndTour must be inside <EndToEndTourProvider>');
    }
    return ctx;
}

export function EndToEndTourProvider({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [active, setActive] = useState(false)
    const [segmentIndex, setSegmentIndex] = useState(0)
    const [ready, setReady] = useState(false);

    const settleTimerRef = useRef(null);
    const currentSegment = active ? END_TO_END_FLOW[segmentIndex] : null;

    // Navigate to the current segment route whenever it changes then wait
    // for page to settle (async data, layout) before show Joyride
    useEffect(() => {
        if (!active || !currentSegment) return undefined;

        setReady(false);

        if (location.pathname !== currentSegment.route){
            navigate(currentSegment.route);
            return undefined; // wait for route to change first
        }

        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(() => setReady(true), SETTLE_DELAY);
        return () => clearTimeout(settleTimerRef.current);
    }, [active, segmentIndex, location.pathname]);

    const start = useCallback(() => {
        // To prevent each page own solo 'Take the tour' from auto-firing 
        // while this end-to-end tour is running across them
        END_TO_END_FLOW.forEach((seg) => {
            if(seg.suppressSoloTourKey) {
                localStorage.setItem(`myralix.tour.seen.${seg.suppressSoloTourKey}`, '1');
            }
        });
        setSegmentIndex(0);
        setActive(true);
    }, []);

    const stop = useCallback(() => {
        setActive(false);
        setReady(false);
        localStorage.setItem(STORAGE_KEY, '1');
    }, []);

    const handleEvent = (data) => {
        const { status } = data;
        if(status === STATUS.SKIPPED) {
            stop();
            return;
        }
        if(status === STATUS.FINISHED) {
            const next = segmentIndex + 1;
            if(next < END_TO_END_FLOW.length){
                setSegmentIndex(next);
            } else {
                stop();
            }
        }
    };

    return (
        <EndToEndTourContext.Provider value={{ active, start, stop }}>
            {children}

            {active && currentSegment && ready && (
              <Joyride 
                steps={currentSegment.steps}
                run={ready}
                continuous
                scrollToFirstStep
                onEvent={handleEvent}
                options={{
                    showProgress: true,
                    buttons: ['skip', 'back', 'primary'],
                    overlayClickAction: 'close',
                    scrollOffset: 100,
                    primaryColor: '#0f766e',
                    textColor: '#1f2937',
                    backgroundColor: '#ffff',
                    arrowColor: '#ffff',
                    overlayColor: 'rgba(15, 23, 42, 0.55)',
                    zIndex: 9999,
                }}
                locale={{
                    back: 'Back',
                    close: 'Close',
                    last: segmentIndex <END_TO_END_FLOW.length - 1 ? 'Next page' : 'Done',
                    next: 'Next',
                    skip: 'Skip tour',
                }}
                styles={{
                    tooltip: { borderRadius: 12, fontSize: 13, padding: 16 },
                    tooltipTitle: { fontSize: 14, fontWeight: 700},
                    buttonPrimary: { backgroundColor: '#0f766e', borderRadius: 8, fontSize: 12, padding: '8px 14px', outline: 'none' },
                    buttonBack:{ fontSize: 12, color: '#6b7280', outline: 'none'},
                    buttonSkip: { fontSize: 12, color: '#6b7280', outline: 'none'},
                }}
              />  
            )}
        </EndToEndTourContext.Provider>
    );
}