      SELECT 
        so.doc_number, 
        so.doc_date, 
        p.name as partner_name,
        i.code as item_code, 
        i.name as item_name, 
        u.name as unit,
        sod.quantity as qty_ordered,
        COALESCE(SUM(sd.quantity), 0) as qty_shipped,
        (sod.quantity - COALESCE(SUM(sd.quantity), 0)) as qty_outstanding
      FROM SalesOrderDetails sod
      JOIN SalesOrders so ON sod.so_id = so.id
      JOIN Items i ON sod.item_id = i.id
      JOIN Partners p ON so.partner_id = p.id
      LEFT JOIN Units u ON i.unit_id = u.id
      LEFT JOIN Shipments s ON s.so_id = so.id AND s.status IN ('Approved', 'Closed')
      LEFT JOIN ShipmentDetails sd ON s.id = sd.shipment_id AND sd.item_id = sod.item_id
      WHERE so.status IN ('Approved', 'Partial', 'Open') 
      GROUP BY so.doc_number, so.doc_date, p.name, i.code, i.name, u.name, sod.quantity
      HAVING (sod.quantity - COALESCE(SUM(sd.quantity), 0)) > 0
      ORDER BY so.doc_date ASC, so.doc_number ASC
