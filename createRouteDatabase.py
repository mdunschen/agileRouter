from sqlalchemy import *
from sqlalchemy import create_engine, ForeignKey
from sqlalchemy import Column, Date, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref

engine = create_engine('sqlite:///routedata.db', echo=True)
Base = declarative_base()

########################################################################
class Delivery(Base):
    """"""
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True)
    username = Column(String)
    delivered = Column(String)

#----------------------------------------------------------------------
    def __init__(self, username, delivered):
        """"""
        self.username = username
        self.delivered = delivered

# create tables
Base.metadata.create_all(engine)