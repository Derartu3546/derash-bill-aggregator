interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  users: User[];
}

export default function UserTable({ users }: Props) {
  return (
    <div className="bg-white shadow rounded-xl p-6 border">
      <h3 className="text-lg font-semibold mb-4">Users</h3>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{user.name}</td>
              <td>{user.email}</td>
              <td className="text-red-600 font-medium">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}