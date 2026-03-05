import FeedbackPopup from '../components/FeedbackPopup';
import ThemesDisplay from '../components/ThemeDisplay';

const Home = () => {
  return (
    <div className='main-content'>
      <h1>Welcome to CodeGrow 🌱</h1>
      <ThemesDisplay />
      <FeedbackPopup />
    </div>
  );
};

export default Home;
