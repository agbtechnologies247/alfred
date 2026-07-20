from setuptools import setup, find_packages

setup(
    name="alfred-sdk",
    version="1.0.0",
    description="Official Python Client SDK for A.L.F.R.E.D. Integration & Optimization Platform",
    author="Bhramit Pardhi",
    author_email="bhramit.pardhi@agbtechnologies.com",
    url="https://github.com/bhramitpardhi/alfred-sdk",
    py_modules=["alfred"],
    install_requires=[
        "requests>=2.25.0",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
