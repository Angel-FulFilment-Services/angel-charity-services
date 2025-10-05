import { useEffect, useState } from 'react';
import { ArrowDownIcon } from '@heroicons/react/20/solid';

// Hook to detect iOS device
const useIsIOS = () => {
    const [isIOS, setIsIOS] = useState(false);
    
    useEffect(() => {
        const userAgent = window.navigator.userAgent;

        // Is IOS and running version 26 or later
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && /26.0 Mobile/.test(userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);
    }, []);
    
    return isIOS;
};

export default function ScrollHint({ scrollRef, basic = false, children, size = 'h-3 w-3', allowClick = true, hideThreshold = 100 }) {
    const [showHint, setShowHint] = useState(false);
    const [hasScroll, setHasScroll] = useState(false);
    const isIOS = useIsIOS();

    useEffect(() => {
        let el = scrollRef.current;
        if (!el) return;

        const checkScroll = () => {
            if (!el) return;
            const isScrollable = el.scrollHeight > el.clientHeight;
            const scrollPercentage = ((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100;
            const shouldHide = scrollPercentage >= hideThreshold;
            setShowHint(isScrollable && !shouldHide);
            setHasScroll(isScrollable);
        };

        checkScroll();

        el.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        // Observe content size changes
        const resizeObserver = new window.ResizeObserver(checkScroll);
        resizeObserver.observe(el);

        // Also observe children for changes (mutation observer)
        const mutationObserver = new window.MutationObserver(checkScroll);
        mutationObserver.observe(el, { childList: true, subtree: true });

        return () => {
            if (el) {
                el.removeEventListener('scroll', checkScroll);
            }
            window.removeEventListener('resize', checkScroll);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [scrollRef, children, hideThreshold]);

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (el) {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    return basic ? (
        hasScroll && (
            <div className="absolute left-0 w-full -mb-1.5 border-none bottom-[0.295rem]">
                <div className="flex items-center h-10 justify-center w-full text-gray-400 dark:text-dark-500 bg-gradient-to-t from-gray-100 dark:from-dark-900/90 to-transparent">
                    { showHint ? (
                        <span
                            className={`text-sm absolute flex items-center justify-center gap-x-1 p-1 rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-dark-800/20 dark:ring-dark-700 animate-bounce cursor-pointer ${
                                isIOS ? '-mt-12' : ''
                            }`}
                            onClick={allowClick ? scrollToBottom : undefined}
                        >
                            <ArrowDownIcon className={`inline ${size}`} />
                            {children}
                        </span>
                    ) : null }
                </div>
            </div>
        )
    ) : (
        showHint ? (
            <div className={`absolute left-0 w-full -mb-1 border-none ${
                isIOS ? 'bottom-16' : 'bottom-0'
            }`}>
                <div className="flex items-center h-10 justify-center w-full text-gray-500 dark:text-dark-500 bg-gradient-to-t from-white dark:from-dark-900/90 to-transparent">
                    <span
                        className="text-sm flex items-center justify-center gap-x-1 p-0.5 rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-dark-800/20 dark:ring-dark-700 animate-bounce cursor-pointer"
                        onClick={allowClick ? scrollToBottom : undefined}
                    >
                        <ArrowDownIcon className="inline h-3 w-3" />
                        {children}
                    </span>
                </div>
            </div>
        ) : null
    );
}