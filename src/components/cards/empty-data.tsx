import ComingSoonFeature from "./coming-soon-features";

interface EmptyDataProps {
    title: string;
    subtitle: string;
}

export default function EmptyData({ title, subtitle }: EmptyDataProps) {
    return <ComingSoonFeature title={title} description={subtitle} />;
}