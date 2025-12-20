import { twMerge } from 'tailwind-merge';

interface ProfileProps {
	className?: string;
}

export default function Profile({ className }: ProfileProps) {
	return (
		<div className={twMerge('mb-3 text-sm font-medium', className)}>
			test-user@example.com
		</div>
	);
}
