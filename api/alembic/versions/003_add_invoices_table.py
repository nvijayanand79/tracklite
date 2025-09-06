"""Add invoices table

Revision ID: 003_add_invoices_table
Revises: 002_add_reports_table
Create Date: 2025-08-26 08:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_invoices_table'
down_revision = '002_add_reports_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('report_id', sa.String(36), sa.ForeignKey('reports.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invoice_no', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('status', sa.Enum('DRAFT', 'ISSUED', 'SENT', 'PAID', 'CANCELLED', name='invoicestatus'), nullable=False, default='DRAFT'),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('invoices')
    # Drop the enum type
    op.execute("DROP TYPE IF EXISTS invoicestatus")
