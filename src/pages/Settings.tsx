import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';

export default function Settings() {
  return (
    <PageWrapper>
      <div>
        <Link
          to="/"
          className="text-blue-400 hover:underline block mb-4"
        >
          ← Back to Home
        </Link>

        <h1>Settings</h1>
        {/* Settings like dark mode, calculate mode, etc. */}
      </div>
    </PageWrapper>
  );
}

