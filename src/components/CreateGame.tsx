import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface ActiveUser {
  _id: string;
  address: string;
}

const CreateGame = () => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const account = useAccount();

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error("Failed to fetch active users");
        }
        const data = await response.json();
        setActiveUsers(data.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchActiveUsers();
    const intervalId = setInterval(fetchActiveUsers, 8000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="grid grid-cols-2  ">
      <div>
        <div>Active Users</div>
        {activeUsers.length === 0 ? (
          <p>No active users found.</p>
        ) : (
          <div className="flex flex-col">
            {activeUsers.map((user) => (
              <button key={user._id}>
                {user.address === account.address
                  ? user.address + " (you)"
                  : user.address}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGame;
