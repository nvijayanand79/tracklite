"""Add owner portal tables

Revision ID: 004
Revises: 003
Create Date: 2025-08-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Create retest_requests table
    op.create_table(
        'retest_requests',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('report_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_email', sa.String(255), nullable=False),
        sa.Column('owner_phone', sa.String(20), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', name='retesttrequststatus'), nullable=False),
        sa.Column('admin_response', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create owner_preferences table
    op.create_table(
        'owner_preferences',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_email', sa.String(255), nullable=False),
        sa.Column('owner_phone', sa.String(20), nullable=True),
        sa.Column('email_notifications', sa.Boolean(), nullable=False),
        sa.Column('whatsapp_notifications', sa.Boolean(), nullable=False),
        sa.Column('sms_notifications', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('owner_email')
    )


def downgrade():
    op.drop_table('owner_preferences')
    op.drop_table('retest_requests')
    op.execute('DROP TYPE IF EXISTS retesttrequststatus')
