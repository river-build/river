import { cn } from '@/utils'

export const TownsIcon = (props: React.SVGProps<SVGSVGElement>) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 159 162"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('text-dark dark:text-white', props.className)}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M36.9346 7.52254C39.4332 4.42896 42.8546 2.32934 46.601 1.45022C48.803 0.667996 51.1738 0.242188 53.644 0.242188H137.925C149.543 0.242188 158.96 9.65995 158.96 21.2773V40.9758C158.96 42.0657 158.877 43.1363 158.718 44.1815L158.801 44.1562V45.207C158.801 56.2527 151.846 65.207 140.801 65.207C136.975 65.207 133.875 68.3079 133.875 72.133V119.99C133.875 130.145 133.875 133.408 129.067 138.997L114.33 153.874C114.078 154.19 113.819 154.502 113.555 154.809C109.579 159.421 104.706 161.762 99.5989 161.762H55.6518C50.5448 161.762 45.6713 159.421 41.6961 154.809C37.5868 150.04 36.9346 144.074 36.9346 139.409V125.204C36.9346 116.275 29.6961 109.036 20.7671 109.036C16.4792 109.036 12.367 107.333 9.33497 104.301L5.15137 100.118C1.853 96.8191 0 92.3456 0 87.681V61.845C0 57.8231 1.37844 53.9227 3.90555 50.7939C6.43266 47.6651 36.9346 7.52254 36.9346 7.52254ZM46.6094 21.5742C46.6094 17.6888 49.7591 14.5391 53.6445 14.5391H137.926C141.811 14.5391 144.961 17.6888 144.961 21.5742V41.2727C144.961 45.1581 141.811 48.3078 137.926 48.3078H122.634C118.749 48.3078 115.599 51.4575 115.599 55.3429V106.996C115.599 110.881 112.449 114.031 108.564 114.031H83.0062C79.1208 114.031 75.9711 110.881 75.9711 106.996V55.343C75.9711 51.4576 72.8213 48.3078 68.9359 48.3078H53.6445C49.7591 48.3078 46.6094 45.1581 46.6094 41.2727V21.5742Z"
                fill="currentColor"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_43_38"
                    x1="-0.0882398"
                    y1="80.7227"
                    x2="159"
                    y2="80.7227"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="currentColor" />
                    <stop offset="0.552083" stopColor="currentColor" />
                    <stop offset="1" stopColor="currentColor" />
                </linearGradient>
            </defs>
        </svg>
    )
}