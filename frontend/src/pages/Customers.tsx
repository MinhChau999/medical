import { Table, Card } from 'antd';

const Customers = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card className="customer-card">
        <div style={{ padding: 20 }}>
          <Table
            columns={[
              { title: 'Name', dataIndex: 'name', key: 'name' },
              { title: 'Email', dataIndex: 'email', key: 'email' },
              { title: 'Phone', dataIndex: 'phone', key: 'phone' },
              { title: 'Orders', dataIndex: 'total_orders', key: 'total_orders' },
              { title: 'Total Spent', dataIndex: 'total_spent', key: 'total_spent' },
            ]}
            dataSource={[]}
            style={{ marginTop: 0 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Customers;