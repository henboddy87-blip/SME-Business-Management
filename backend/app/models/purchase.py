from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class PurchaseOrder(TenantModel):
    __tablename__ = "purchase_orders"

    po_number = Column(String(50), nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    status = Column(String(50), default="Draft") # Draft, Pending, Approved, Partially Received, Received, Cancelled
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    expected_delivery_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    warehouse = relationship("Warehouse")
    user = relationship("User")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(TenantModel):
    __tablename__ = "purchase_order_items"

    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    received_quantity = Column(Float, default=0.0)
    unit_cost = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")

class Purchase(TenantModel):
    __tablename__ = "purchases"

    purchase_number = Column(String(50), nullable=False, index=True)
    po_id = Column(String(36), ForeignKey("purchase_orders.id"), nullable=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    status = Column(String(50), default="Received") # Received, Partially Returned, Returned
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    payment_status = Column(String(50), default="Unpaid") # Paid, Partial, Unpaid
    payment_method = Column(String(50), default="Cash")
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    supplier = relationship("Supplier", back_populates="purchases")
    warehouse = relationship("Warehouse")
    user = relationship("User")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")

class PurchaseItem(TenantModel):
    __tablename__ = "purchase_items"

    purchase_id = Column(String(36), ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")

class PurchaseReturn(TenantModel):
    __tablename__ = "purchase_returns"

    return_number = Column(String(50), nullable=False, index=True)
    purchase_id = Column(String(36), ForeignKey("purchases.id"), nullable=False)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    total_refund = Column(Float, default=0.0)
    reason = Column(String(255), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    items = relationship("PurchaseReturnItem", back_populates="purchase_return", cascade="all, delete-orphan")

class PurchaseReturnItem(TenantModel):
    __tablename__ = "purchase_return_items"

    purchase_return_id = Column(String(36), ForeignKey("purchase_returns.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    refund_amount = Column(Float, nullable=False)

    purchase_return = relationship("PurchaseReturn", back_populates="items")
